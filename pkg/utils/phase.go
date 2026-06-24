package utils

type PhaseSummary struct {
	AllSucceeded bool
	AnyFailed    bool
	AnyRunning   bool
	HasItems     bool
}

func SummarizePhases(phases []string, succeeded, failed, running string) PhaseSummary {
	s := PhaseSummary{AllSucceeded: true}
	for _, p := range phases {
		s.HasItems = true
		switch p {
		case succeeded:
		case failed:
			s.AnyFailed = true
			s.AllSucceeded = false
		case running:
			s.AnyRunning = true
			s.AllSucceeded = false
		default:
			s.AllSucceeded = false
		}
	}
	return s
}
