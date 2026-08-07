package embodiedruntime

import (
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

const (
	DefaultROSSocket    = "/var/run/rlinf/ros-ctrl.sock"
	DefaultCameraSocket = "/var/run/rlinf/camera-ctrl.sock"
	DefaultTimeout      = 10 * time.Second
	LongTimeout         = 30 * time.Second
)

func UnixTarget(socketPath string) string {
	return "unix://" + socketPath
}

func Dial(target string) (*grpc.ClientConn, error) {
	return grpc.NewClient(target, grpc.WithTransportCredentials(insecure.NewCredentials()))
}

func ResolveTarget(socketPath, defaultSocket, address string) string {
	if address != "" {
		return address
	}
	path := socketPath
	if path == "" {
		path = defaultSocket
	}
	return UnixTarget(path)
}

func ROSSocketPath() string {
	if v := os.Getenv("RLINF_EMBODIED_ROS_SOCKET_PATH"); v != "" {
		return v
	}
	return DefaultROSSocket
}

func CameraSocketPath() string {
	if v := os.Getenv("RLINF_EMBODIED_CAMERA_SOCKET_PATH"); v != "" {
		return v
	}
	return DefaultCameraSocket
}

func DialRobot(address string) (*grpc.ClientConn, error) {
	target := ResolveTarget(ROSSocketPath(), DefaultROSSocket, address)
	return Dial(target)
}

func DialCamera(address string) (*grpc.ClientConn, error) {
	target := ResolveTarget(CameraSocketPath(), DefaultCameraSocket, address)
	return Dial(target)
}
