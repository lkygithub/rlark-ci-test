package utils

type StatusEntry interface {
	GetPhase() string
	SetPhase(string)
	SetMessage(string)
}

func SyncStatusEntry(entry StatusEntry, newPhase, newMessage string) bool {
	if newPhase == "" || newPhase == entry.GetPhase() {
		return false
	}
	entry.SetPhase(newPhase)
	entry.SetMessage(newMessage)
	return true
}