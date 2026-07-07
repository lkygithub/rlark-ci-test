package nodeserver

type PodIPInfo struct {
	IP           string `json:"ip"`
	PrefixLength int    `json:"prefix_length"`
}
