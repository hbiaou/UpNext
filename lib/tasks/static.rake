namespace :generate do
  desc "Generate static site for GitHub Pages"
  task static_site: :environment do
    puts "Generating static site..."
    
    # Set Rails to production mode for asset compilation
    Rails.env = "production"
    
    # Generate static pages
    pages = [
      "/",
      "/pwa/manifest.json",
      "/pwa/service-worker.js"
    ]
    
    require 'net/http'
    require 'uri'
    
    # Start Rails server in background
    server_pid = spawn("bundle exec rails server -p 3001 -e production", 
                      out: "/dev/null", err: "/dev/null")
    
    # Wait for server to start
    sleep 5
    
    # Generate static files
    pages.each do |path|
      begin
        uri = URI("http://localhost:3001#{path}")
        response = Net::HTTP.get_response(uri)
        
        if response.code == '200'
          file_path = "public#{path}"
          file_path += "index.html" if path.end_with?('/')
          
          FileUtils.mkdir_p(File.dirname(file_path))
          File.write(file_path, response.body)
          puts "Generated: #{file_path}"
        end
      rescue => e
        puts "Error generating #{path}: #{e.message}"
      end
    end
    
    # Stop Rails server
    Process.kill('TERM', server_pid)
    Process.wait(server_pid)
    
    puts "Static site generation complete!"
  end
end