package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/rlinf/rlark/pkg/api"
)

func main() {
	var addr string
	flag.StringVar(&addr, "addr", ":8090", "The address the API gateway binds to.")
	flag.Parse()

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	gw := api.NewGateway()
	gw.RegisterRoutes(r)

	fmt.Printf("api-gateway listening on %s\n", addr)
	if err := r.Run(addr); err != nil {
		fmt.Fprintf(os.Stderr, "api-gateway exited: %v\n", err)
		os.Exit(1)
	}
}