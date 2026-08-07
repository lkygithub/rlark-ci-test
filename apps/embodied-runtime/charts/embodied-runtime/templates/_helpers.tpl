{{/*
Expand the chart name.
*/}}
{{- define "embodied-runtime.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Fully-qualified app name. Defaults to "<release>-<chart>" unless the release
already contains the chart name (e.g. --install embodied-runtime), in which
case it collapses to the release name — so the device-plugin resource names
match the original static manifests when installed as `embodied-runtime`.
*/}}
{{- define "embodied-runtime.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := include "embodied-runtime.name" . -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
device-plugin resource name (DaemonSet / SA / Role / RoleBinding).
*/}}
{{- define "embodied-runtime.devicePluginName" -}}
{{- printf "%s-device-plugin" (include "embodied-runtime.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
ServiceAccount name (== device-plugin name, matching the original RBAC).
*/}}
{{- define "embodied-runtime.serviceAccountName" -}}
{{- include "embodied-runtime.devicePluginName" . -}}
{{- end -}}

{{/*
ConfigMap name.
*/}}
{{- define "embodied-runtime.configMapName" -}}
{{- printf "%s-config" (include "embodied-runtime.devicePluginName" .) -}}
{{- end -}}

{{/*
Common labels.
*/}}
{{- define "embodied-runtime.labels" -}}
app.kubernetes.io/name: {{ include "embodied-runtime.name" . }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels (must not change after install — immutable).
*/}}
{{- define "embodied-runtime.selectorLabels" -}}
app.kubernetes.io/name: {{ include "embodied-runtime.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
