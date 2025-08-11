require "test_helper"

class JavascriptFunctionalityTest < ActionDispatch::IntegrationTest
  test "should include required JavaScript modules and Dexie for IndexedDB" do
    get root_path
    assert_response :success

    # Check for importmap configuration
    assert_select "script[type=importmap]" do |elements|
      importmap_content = elements.first.content

      # Should include main application modules
      assert_includes importmap_content, "application"
      assert_includes importmap_content, "dexie"  # IndexedDB library

      # Should include stimulus controllers
      assert_includes importmap_content, "controllers"
    end
  end

  test "should have proper Stimulus controller structure" do
    get root_path

    # Check that Stimulus controllers are properly registered
    assert_select "[data-controller*=tasks]"
    assert_select "[data-controller*=chat]"
    assert_select "[data-controller*=settings]"

    # Check for proper data attributes for actions
    assert_select "[data-action*=click]"
    assert_select "[data-action*=submit]"
  end

  test "should include service modules for AI integration" do
    get root_path

    # The service modules should be loaded via importmap
    assert_select "script[type=importmap]" do |elements|
      importmap_content = elements.first.content
      assert_includes importmap_content, "services/ai-provider-service"
      assert_includes importmap_content, "services/storage-service"
      assert_includes importmap_content, "services/validation-service"
    end
  end
end
