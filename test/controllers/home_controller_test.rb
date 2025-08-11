require "test_helper"

class HomeControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get root_path
    assert_response :success
    assert_select "title", "UpNext - AI Task & Note Manager"
    assert_select "h1", "UpNext"  # Main title in header
    assert_select "[data-controller*=tasks]"  # Tasks controller
    assert_select "[data-controller*=chat]"   # Chat controller
  end

  test "should render application layout with proper meta tags" do
    get root_path
    assert_select "meta[name=viewport]"
    assert_select "meta[name=theme-color]"
    assert_select "meta[name=apple-mobile-web-app-capable]"
  end

  test "should include required JavaScript modules and PWA features" do
    get root_path
    assert_select "script[type=importmap]"
    assert_select "link[rel=manifest]"
    assert_match /serviceWorker/, response.body
  end

  test "should have proper task tab structure" do
    get root_path
    assert_select "button[data-tab=today]", "Today"
    assert_select "button[data-tab=upcoming]", "Upcoming"
    assert_select "button[data-tab=completed]", "Completed"
  end

  test "should include AI chat interface" do
    get root_path
    assert_select "[data-controller*=chat]"
    assert_select "h2", "AI Assistant"
    assert_select "input[placeholder*=\"Ask me to help\"]"
  end
end
