package jumper

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"golang.org/x/term"
)

// Terminal is the interface for a terminal session to a target.
type Terminal interface {
	io.ReadWriteCloser
	Resize(rows, cols uint16) error
}

// Target represents a connectable target in the bastion host.
type Target struct {
	ID      string
	Name    string
	Address string
	Info    string
}

// TargetResolver resolves available targets for the bastion host.
type TargetResolver interface {
	Resolve(ctx context.Context) ([]Target, error)
}

// TerminalDialer creates a terminal session to a given target.
type TerminalDialer interface {
	Dial(ctx context.Context, target Target) (Terminal, error)
}

// Window represents a terminal window size change.
type Window struct {
	Width  int
	Height int
}

// Run starts the bastion host TUI using bubbletea for local terminal.
func Run(ctx context.Context, resolver TargetResolver, dialer TerminalDialer) error {
	for {
		target, err := selectTarget(ctx, resolver, dialer)
		if err != nil {
			return err
		}
		if target == nil {
			return nil
		}

		if err := connectAndServe(ctx, *target, dialer); err != nil {
			return err
		}
	}
}

// Serve runs the bastion host over explicit I/O streams (e.g. SSH session).
func Serve(ctx context.Context, resolver TargetResolver, dialer TerminalDialer,
	stdin io.Reader, stdout io.Writer, resizeCh <-chan Window) error {

	for {
		target, err := selectTargetText(ctx, resolver, stdin, stdout, dialer)
		if err != nil {
			return err
		}
		if target == nil {
			return nil
		}

		if err := connectAndServeWithIO(ctx, *target, dialer, stdin, stdout, resizeCh); err != nil {
			return err
		}
	}
}

// ---------------------------------------------------------------------------
// Bubbletea TUI target selection
// ---------------------------------------------------------------------------

type selectionState int

const (
	stateLoading selectionState = iota
	stateReady
	stateConnecting
	stateError
)

const pageSize = 10

type tickMsg time.Time
type connectedMsg struct{}
type targetsLoadedMsg struct {
	targets []Target
}
type errMsg struct {
	err error
}

type selectModel struct {
	state     selectionState
	targets   []Target
	filtered  []Target
	filter    []rune
	cursor    int
	page      int
	err       error
	selected  *Target
	ctx       context.Context
	resolver  TargetResolver
	dialer    TerminalDialer
	startTime time.Time
	elapsed   time.Duration
	width     int
	height    int
}

func newSelectModel(resolver TargetResolver, dialer TerminalDialer, ctx context.Context) selectModel {
	return selectModel{
		state:     stateLoading,
		resolver:  resolver,
		dialer:    dialer,
		ctx:       ctx,
		startTime: time.Now(),
		width:     80,
		height:    24,
	}
}

func (m selectModel) applyFilter() selectModel {
	m.filtered = nil
	raw := string(m.filter)
	for _, t := range m.targets {
		if raw == "" || strings.Contains(strings.ToLower(t.Name), strings.ToLower(raw)) {
			m.filtered = append(m.filtered, t)
		}
	}
	if m.cursor >= len(m.filtered) {
		m.cursor = len(m.filtered) - 1
	}
	if m.cursor < 0 && len(m.filtered) > 0 {
		m.cursor = 0
	}
	m = m.clampPage()
	return m
}

func (m selectModel) clampPage() selectModel {
	if len(m.filtered) == 0 {
		m.page = 0
		return m
	}
	maxPage := (len(m.filtered) - 1) / pageSize
	if m.page > maxPage {
		m.page = maxPage
	}
	pageStart := m.page * pageSize
	if m.cursor < pageStart {
		m.page = m.cursor / pageSize
	}
	if m.cursor >= pageStart+pageSize {
		m.page = m.cursor / pageSize
	}
	return m
}

func (m selectModel) pageStart() int {
	return m.page * pageSize
}

func (m selectModel) pageEnd() int {
	end := m.pageStart() + pageSize
	if end > len(m.filtered) {
		end = len(m.filtered)
	}
	return end
}

func (m selectModel) totalPages() int {
	if len(m.filtered) == 0 {
		return 1
	}
	return (len(m.filtered)-1)/pageSize + 1
}

func (m selectModel) Init() tea.Cmd {
	return tea.Batch(m.loadTargets, m.tick())
}

func (m selectModel) tick() tea.Cmd {
	return tea.Tick(time.Second, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func (m selectModel) loadTargets() tea.Msg {
	targets, err := m.resolver.Resolve(m.ctx)
	if err != nil {
		return errMsg{err}
	}
	return targetsLoadedMsg{targets}
}

func (m selectModel) connect() tea.Msg {
	_, err := m.dialer.Dial(m.ctx, *m.selected)
	if err != nil {
		return errMsg{err}
	}
	return connectedMsg{}
}

func (m selectModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			return m, tea.Quit
		case "q":
			if m.state != stateConnecting {
				return m, tea.Quit
			}
		}

		if m.state == stateReady {
			switch msg.String() {
			case "up", "k":
				if m.cursor > 0 {
					m.cursor--
					m = m.clampPage()
				}
			case "down", "j":
				if m.cursor < len(m.filtered)-1 {
					m.cursor++
					m = m.clampPage()
				}
			case "left", "pgup":
				if m.page > 0 {
					m.page--
					m.cursor = m.pageStart()
				}
			case "right", "pgdown":
				if m.page < m.totalPages()-1 {
					m.page++
					m.cursor = m.pageStart()
				}
			case "enter", " ":
				if len(m.filtered) == 0 {
					return m, nil
				}
				m.state = stateConnecting
				m.selected = &m.filtered[m.cursor]
				m.startTime = time.Now()
				return m, m.connect
			case "r":
				m.state = stateLoading
				m.startTime = time.Now()
				m.err = nil
				return m, tea.Batch(m.loadTargets, m.tick())
			case "esc":
				if len(m.filter) > 0 {
					m.filter = nil
					m = m.applyFilter()
				}
			case "backspace":
				if len(m.filter) > 0 {
					m.filter = m.filter[:len(m.filter)-1]
					m = m.applyFilter()
				}
			default:
				if len(msg.String()) == 1 {
					r := []rune(msg.String())[0]
					if r >= 32 && r <= 126 {
						m.filter = append(m.filter, r)
						m = m.applyFilter()
					}
				}
			}
		}

		if m.state == stateError && msg.String() == "r" {
			m.state = stateLoading
			m.startTime = time.Now()
			m.err = nil
			return m, tea.Batch(m.loadTargets, m.tick())
		}

	case tickMsg:
		if m.state == stateLoading || m.state == stateConnecting {
			m.elapsed = time.Since(m.startTime).Round(time.Second)
			return m, m.tick()
		}

	case targetsLoadedMsg:
		m.targets = msg.targets
		m.filtered = make([]Target, len(m.targets))
		copy(m.filtered, m.targets)
		if len(m.targets) == 0 {
			m.state = stateReady
			m.err = fmt.Errorf("no targets available")
		} else {
			m.state = stateReady
		}
		return m, nil

	case connectedMsg:
		return m, tea.Quit

	case errMsg:
		m.state = stateError
		m.err = msg.err
		return m, nil
	}

	return m, nil
}

func (m selectModel) View() string {
	switch m.state {
	case stateLoading:
		return m.styleLoading()
	case stateConnecting:
		return m.styleConnecting()
	case stateError:
		return m.styleError()
	default:
		return m.styleList()
	}
}

func (m selectModel) styleLoading() string {
	title := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("39")).
		Render(" RLark Bastion Host ")

	spinner := "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
	frame := (int(m.elapsed.Seconds()*10) % len(spinner))
	spinnerChar := string(spinner[frame])

	loading := lipgloss.NewStyle().
		Foreground(lipgloss.Color("240")).
		Render(fmt.Sprintf("%s  Loading targets...  (%s)", spinnerChar, m.elapsed))

	return lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Align(lipgloss.Center, lipgloss.Center).
		Render(lipgloss.JoinVertical(lipgloss.Center, title, "", loading))
}

func (m selectModel) styleConnecting() string {
	title := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("39")).
		Render(" RLark Bastion Host ")

	spinner := "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
	frame := (int(m.elapsed.Seconds()*10) % len(spinner))
	spinnerChar := string(spinner[frame])

	name := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("220")).
		Render(m.selected.Name)

	connecting := lipgloss.NewStyle().
		Foreground(lipgloss.Color("240")).
		Render(fmt.Sprintf("%s  Connecting to %s...  (%s)", spinnerChar, name, m.elapsed))

	return lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Align(lipgloss.Center, lipgloss.Center).
		Render(lipgloss.JoinVertical(lipgloss.Center, title, "", connecting))
}

func (m selectModel) styleError() string {
	title := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("39")).
		Render(" RLark Bastion Host ")

	errBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("196")).
		Padding(0, 2).
		Render(lipgloss.NewStyle().
			Foreground(lipgloss.Color("196")).
			Render(fmt.Sprintf("Error: %v", m.err)))

	help := lipgloss.NewStyle().
		Foreground(lipgloss.Color("240")).
		Render("r: retry  •  q: quit")

	return lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Align(lipgloss.Center, lipgloss.Center).
		Render(lipgloss.JoinVertical(lipgloss.Center, title, "", errBox, "", help))
}

func (m selectModel) styleList() string {
	targetCount := len(m.targets)
	filteredCount := len(m.filtered)
	showFilter := string(m.filter)

	// Title
	title := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("39")).
		Padding(0, 1).
		Render(" RLark Bastion Host ")

	// Filter bar
	filterStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("240")).
		Padding(0, 1).
		Width(m.width - 6)

	filterLabel := lipgloss.NewStyle().
		Foreground(lipgloss.Color("39")).
		Render("search")
	filterValue := showFilter
	if filterValue == "" {
		filterValue = lipgloss.NewStyle().
			Foreground(lipgloss.Color("240")).
			Render("type to filter...")
	} else {
		filterValue = lipgloss.NewStyle().
			Foreground(lipgloss.Color("220")).
			Render(filterValue)
	}
	filterDisplay := lipgloss.JoinHorizontal(lipgloss.Left,
		filterLabel, lipgloss.NewStyle().Render(" "),
		filterValue,
		lipgloss.NewStyle().Render(" "),
		lipgloss.NewStyle().
			Foreground(lipgloss.Color("240")).
			Render(fmt.Sprintf("(%d/%d)", filteredCount, targetCount)),
	)
	filterBar := filterStyle.Render(filterDisplay)

	// Subtitle with pagination info
	pageInfo := fmt.Sprintf("  Page %d/%d", m.page+1, m.totalPages())
	subtitle := lipgloss.NewStyle().
		Foreground(lipgloss.Color("240")).
		Render(pageInfo)

	// Item list (current page only)
	cursorStyle := lipgloss.NewStyle().
		Foreground(lipgloss.Color("39")).
		Render("▸")

	noCursor := lipgloss.NewStyle().Render(" ")

	itemStyle := lipgloss.NewStyle().Padding(0, 1)
	selectedItemStyle := lipgloss.NewStyle().
		Padding(0, 1).
		Background(lipgloss.Color("236"))

	itemNameStyle := lipgloss.NewStyle().Bold(true)
	infoStyle := lipgloss.NewStyle().
		Foreground(lipgloss.Color("240"))

	help := lipgloss.NewStyle().
		Foreground(lipgloss.Color("240")).
		Render("↑/↓ j/k: nav  •  ←/→: page  •  enter: connect  •  esc: clear  •  r: refresh  •  q: quit")

	var items []string
	pageStart := m.pageStart()
	pageEnd := m.pageEnd()
	for i := pageStart; i < pageEnd; i++ {
		t := m.filtered[i]
		cursor := noCursor
		style := itemStyle
		isCursor := i == m.cursor
		if isCursor {
			cursor = cursorStyle
			style = selectedItemStyle
		}

		parts := cursor + " "
		if isCursor {
			parts += style.Render(itemNameStyle.Foreground(lipgloss.Color("220")).Render(t.Name))
		} else {
			parts += style.Render(t.Name)
		}
		if t.Info != "" {
			parts += infoStyle.Render("  " + t.Info)
		}
		items = append(items, parts)
	}

	if len(items) == 0 {
		items = append(items, lipgloss.NewStyle().
			Foreground(lipgloss.Color("240")).
			Padding(0, 1).
			Render("no targets match filter"))
	}

	body := lipgloss.JoinVertical(
		lipgloss.Left,
		append([]string{subtitle}, items...)...,
	)

	// Detail panel for selected target
	detail := ""
	if m.cursor >= 0 && m.cursor < len(m.filtered) && len(m.filtered) > 0 {
		t := m.filtered[m.cursor]
		detailStyle := lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("39")).
			Padding(0, 1).
			Width(m.width - 6)
		detailLines := []string{
			fmt.Sprintf("ID:      %s", t.ID),
			fmt.Sprintf("Name:    %s", t.Name),
			fmt.Sprintf("Address: %s", t.Address),
		}
		if t.Info != "" {
			detailLines = append(detailLines, fmt.Sprintf("Info:    %s", t.Info))
		}
		detail = "\n" + detailStyle.Render(strings.Join(detailLines, "\n"))
	}

	return lipgloss.NewStyle().
		Width(m.width).
		Padding(1, 2).
		Render(lipgloss.JoinVertical(lipgloss.Left, title, "", filterBar, "", body, detail, "", help))
}

func selectTarget(ctx context.Context, resolver TargetResolver, dialer TerminalDialer) (*Target, error) {
	p := tea.NewProgram(newSelectModel(resolver, dialer, ctx))
	m, err := p.Run()
	if err != nil {
		return nil, err
	}
	sm := m.(selectModel)
	if sm.err != nil {
		return nil, sm.err
	}
	return sm.selected, nil
}

// ---------------------------------------------------------------------------
// Text-based target selection (for SSH / non-TUI mode)
// ---------------------------------------------------------------------------

func selectTargetText(ctx context.Context, resolver TargetResolver, stdin io.Reader, stdout io.Writer, dialer TerminalDialer) (*Target, error) {
	// Loading indicator
	fprintf(stdout, "\r\n  RLark Bastion Host\r\n")
	fprintf(stdout, "  ─────────────────────────────\r\n")
	fprintf(stdout, "  Loading targets...\r\n")

	targets, err := resolver.Resolve(ctx)
	if err != nil {
		fprintf(stdout, "  \rError: %v\r\n\r\n", err)
		return nil, err
	}

	if len(targets) == 0 {
		fprintf(stdout, "  \rNo targets available.\r\n")
		return nil, fmt.Errorf("no targets available")
	}

	// Clear loading line
	fprintf(stdout, "\033[2K\r")

	for {
		fprintf(stdout, "\r\n  RLark Bastion Host\r\n")
		fprintf(stdout, "  ─────────────────────────────\r\n")
		fprintf(stdout, "  %d target(s) available\r\n\r\n", len(targets))
		for i, t := range targets {
			line := fmt.Sprintf("  %2d. %s", i+1, t.Name)
			if t.Info != "" {
				line += "  (" + t.Info + ")"
			}
			fprintf(stdout, "%s\r\n", line)
		}
		fprintf(stdout, "\r\n  r: refresh  •  0: quit  •  number: connect\r\n")
		fprintf(stdout, "\r\n  Enter number: ")

		scanner := bufio.NewScanner(stdin)
		if !scanner.Scan() {
			return nil, scanner.Err()
		}
		line := strings.TrimSpace(scanner.Text())

		if line == "r" {
			fprintf(stdout, "\033[2K\r  Loading targets...\r\n")
			targets, err = resolver.Resolve(ctx)
			if err != nil {
				fprintf(stdout, "  Error: %v\r\n", err)
				fprintf(stdout, "  Press Enter to continue...")
				scanner.Scan()
				continue
			}
			if len(targets) == 0 {
				fprintf(stdout, "  No targets available.\r\n")
				fprintf(stdout, "  Press Enter to continue...")
				scanner.Scan()
				continue
			}
			// Clear lines and redraw
			continue
		}

		n, err := strconv.Atoi(line)
		if err != nil || n < 0 || n > len(targets) {
			fprintf(stdout, "\r  Invalid selection.\r\n")
			continue
		}
		if n == 0 {
			fprintf(stdout, "\r\n")
			return nil, nil
		}

		target := &targets[n-1]
		fprintf(stdout, "\r  Connecting to %s...\r\n", target.Name)

		// Try connecting to validate target is reachable
		term, err := dialer.Dial(ctx, *target)
		if err != nil {
			fprintf(stdout, "  \rConnection failed: %v\r\n", err)
			fprintf(stdout, "  Press Enter to continue...")
			scanner.Scan()
			continue
		}
		_ = term.Close()

		fprintf(stdout, "\r\n")
		return target, nil
	}
}

func fprintf(w io.Writer, format string, args ...interface{}) {
	_, _ = fmt.Fprintf(w, format, args...)
}

// ---------------------------------------------------------------------------
// Terminal session I/O bridge
// ---------------------------------------------------------------------------

func connectAndServe(ctx context.Context, target Target, dialer TerminalDialer) error {
	oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
	if err != nil {
		return fmt.Errorf("raw mode: %w", err)
	}
	defer func() { _ = term.Restore(int(os.Stdin.Fd()), oldState) }()

	sigch := make(chan os.Signal, 1)
	signal.Notify(sigch, syscall.SIGWINCH)
	defer signal.Stop(sigch)

	resizeCh := make(chan Window, 1)
	go func() {
		for range sigch {
			if w, h, err := term.GetSize(int(os.Stdin.Fd())); err == nil {
				resizeCh <- Window{Width: w, Height: h}
			}
		}
	}()

	return connectAndServeWithIO(ctx, target, dialer, os.Stdin, os.Stdout, resizeCh)
}

func connectAndServeWithIO(ctx context.Context, target Target, dialer TerminalDialer,
	stdin io.Reader, stdout io.Writer, resizeCh <-chan Window) error {

	terminal, err := dialer.Dial(ctx, target)
	if err != nil {
		return fmt.Errorf("dial %s: %w", target.Name, err)
	}
	defer func() { _ = terminal.Close() }()

	select {
	case w := <-resizeCh:
		_ = terminal.Resize(uint16(w.Height), uint16(w.Width))
	default:
	}

	errCh := make(chan error, 1)
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		_, err := io.Copy(terminal, stdin)
		_ = terminal.Close()
		errCh <- err
	}()

	go func() {
		defer wg.Done()
		_, err := io.Copy(stdout, terminal)
		errCh <- err
	}()

	for {
		select {
		case <-errCh:
			wg.Wait()
			return nil
		case <-ctx.Done():
			return ctx.Err()
		case w, ok := <-resizeCh:
			if ok {
				_ = terminal.Resize(uint16(w.Height), uint16(w.Width))
			}
		}
	}
}
