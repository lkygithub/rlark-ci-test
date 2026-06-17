package protocol

// SSH Protocol: https://github.com/openssh/openssh-portable/blob/master/PROTOCOL

const (
	ForwardRequestType = "streamlocal-forward@openssh.com"
	CancelRequestType  = "cancel-streamlocal-forward@openssh.com"

	ForwardedRequestType = "forwarded-streamlocal@openssh.com"
)

type RemoteForwardRequest struct {
	BindUnixSocket string // It's target in srp
}

type RemoteForwardCancelRequest struct {
	BindUnixSocket string // It's target in srp
}

type RemoteForwardChannelData struct {
	SocketPath string
	Reserved   string
}

type DirectPayload struct {
	Host              string
	Port              uint32
	OriginatorAddress string
	OriginatorPort    uint32
}
