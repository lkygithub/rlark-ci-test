package db

// ResourceModel is the interface that all resource models must implement.
type ResourceModel interface {
	// GetBase returns the underlying BaseResourceModel.
	GetBase() *BaseResourceModel

	// TableName returns the database table name.
	TableName() string
}

// GetBase implements ResourceModel for JobModel.
func (m *JobModel) GetBase() *BaseResourceModel {
	return &m.BaseResourceModel
}

// GetBase implements ResourceModel for NodeModel.
func (m *NodeModel) GetBase() *BaseResourceModel {
	return &m.BaseResourceModel
}

// GetBase implements ResourceModel for TaskModel.
func (m *TaskModel) GetBase() *BaseResourceModel {
	return &m.BaseResourceModel
}

// GetBase implements ResourceModel for WorkflowModel.
func (m *WorkflowModel) GetBase() *BaseResourceModel {
	return &m.BaseResourceModel
}
