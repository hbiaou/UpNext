class CategoriesController < ApplicationController
  before_action :set_default_response_format

  def index
    render json: { message: "Categories managed via IndexedDB client-side" }
  end

  def create
    render json: { message: "Category creation handled via IndexedDB client-side", success: true }
  end

  def update
    render json: { message: "Category update handled via IndexedDB client-side", success: true }
  end

  def destroy
    render json: { message: "Category deletion handled via IndexedDB client-side", success: true }
  end

  private

  def set_default_response_format
    request.format = :json if request.format.html?
  end

  def category_params
    params.require(:category).permit(:name, :color, :icon)
  end
end
