package clicommands

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/rlinf/rlark/pkg/server"
)

func SignCommand() *cobra.Command {
	req := server.SignRequest{
		Role:     "agent",
		ClientID: "example-client-id",
	}
	var output string

	cmd := &cobra.Command{
		Use:   "sign",
		Short: "Sign a certificate.",
		RunE: func(cmd *cobra.Command, args []string) error {
			client, err := server.NewClientFromKubernetes(cmd.Context(), Port, KubeClientConfig)
			if err != nil {
				return err
			}

			target := client.BuildURL("api", "sign")
			resp, err := client.DoRequestWithObject(cmd.Context(), "POST", target, req)
			if err != nil {
				return err
			}
			defer resp.Body.Close()

			if resp.StatusCode != 200 {
				return fmt.Errorf("sign certificate failed with status: %s", resp.Status)
			}

			var respData map[string]string
			if err := json.NewDecoder(resp.Body).Decode(&respData); err != nil {
				return fmt.Errorf("failed to decode response: %w", err)
			}

			cert, ok := respData["cert"]
			if !ok {
				return fmt.Errorf("response missing certificate")
			}
			key, ok := respData["key"]
			if !ok {
				return fmt.Errorf("response missing privateKey")
			}

			if output != "" {
				certPath := filepath.Join(output, "cert.pem")
				keyPath := filepath.Join(output, "key.pem")
				if err := os.WriteFile(certPath, []byte(cert), 0600); err != nil {
					return fmt.Errorf("failed to write certificate: %w", err)
				}
				if err := os.WriteFile(keyPath, []byte(key), 0600); err != nil {
					return fmt.Errorf("failed to write private key: %w", err)
				}
			} else {
				fmt.Println("Certificate:")
				fmt.Println(cert)
				fmt.Println("Private Key:")
				fmt.Println(key)
			}

			return nil
		},
	}

	cmd.Flags().StringVarP(&req.Role, "role", "r", req.Role, "Role for the certificate (e.g. admin, peer, agent)")
	cmd.Flags().StringVarP(&req.ClientID, "client-id", "c", req.ClientID, "Client ID for agent role (optional)")
	cmd.Flags().StringVarP(&output, "output", "o", "", "Output directory for the signed certificate and key (optional)")

	return cmd
}
