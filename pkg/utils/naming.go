package utils

import "fmt"

func ChildName(parent, child string) string {
	return fmt.Sprintf("%s-%s", parent, child)
}
