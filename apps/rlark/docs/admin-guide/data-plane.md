# Data Plane Onboarding

1. Sign in to the administrator console and create a cluster registration.
2. Generate the installation command and cluster-scoped credentials.
3. Run the command on the target Kubernetes cluster with the documented privileges.
4. Verify that the Agent connects and the cluster and usable Worker nodes appear in RLark.
5. Add scheduling metadata and run a smoke-test Job.

Treat generated credentials as secrets and create a separate registration for each data plane.
