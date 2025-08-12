class TasksController < ApplicationController
  before_action :set_default_response_format

  def index
    render json: { message: "Tasks managed via IndexedDB client-side" }
  end

  def show
    render json: { message: "Task details managed via IndexedDB client-side" }
  end

  def create
    render json: { message: "Task creation handled via IndexedDB client-side", success: true }
  end

  def update
    render json: { message: "Task update handled via IndexedDB client-side", success: true }
  end

  def destroy
    render json: { message: "Task deletion handled via IndexedDB client-side", success: true }
  end

  def toggle_complete
    render json: { message: "Task completion toggle handled via IndexedDB client-side", success: true }
  end

  private

  def set_default_response_format
    request.format = :json if request.format.html?
  end

  def task_params
    params.require(:task).permit(:title, :description, :category_id, :priority, :due_date, subtasks: [])
  end
end
