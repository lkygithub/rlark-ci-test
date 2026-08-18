# Storage

RLark exposes cluster storage classes and object-storage operations through the platform. Select storage that exists in the target data-plane cluster and attach it to Task roles as required. API details are listed in the [Storage API](../storage-api.md).

## Using the UI

Platform Console → Storage. Browse StorageClasses or object storage by cluster; when creating a Job, select storage for the relevant Worker role and configure its mount path.

## API equivalent

Use StorageClass, provider, and object-file endpoints described in the [Storage API](../storage-api.md).
