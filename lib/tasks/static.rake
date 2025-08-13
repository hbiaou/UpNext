namespace :generate do
  desc "Generate static site for GitHub Pages"
  task static_site: :environment do
    puts "Generating static site..."

    # Ensure we're in production mode
    Rails.env = "production"
    ENV["RAILS_ENV"] = "production"

    # Generate static pages with target file mapping
    pages = {
      "/" => "index.html",
      "/manifest" => "manifest.json",
      "/service-worker" => "service-worker.js"
    }

    require "net/http"
    require "uri"
    require "socket"

    # Find available port (Windows and Linux compatible)
    port = 3001
    10.times do
      begin
        # Try to bind to the port to see if it's available
        server = TCPServer.new('localhost', port)
        server.close
        break
      rescue Errno::EADDRINUSE
        port += 1
      end
    end

    puts "Using port #{port} for Rails server"

    # Start Rails server in background with more time and better error handling
    server_pid = spawn("bundle exec rails server -p #{port} -e production",
                      out: "server.log", err: "server.log")

    # Wait for server to start with better checking
    server_ready = false
    30.times do |i|
      begin
        sleep 1
        uri = URI("http://localhost:#{port}/")
        response = Net::HTTP.get_response(uri)
        if response.code
          server_ready = true
          puts "Server ready after #{i + 1} seconds"
          break
        end
      rescue
        puts "Waiting for server to start... (#{i + 1}/30)"
      end
    end

    unless server_ready
      puts "Server failed to start. Check server.log for details."
      if File.exist?("server.log")
        puts "Server log:"
        puts File.read("server.log")
      end
      exit 1
    end

    # Generate static files
    pages.each do |path, filename|
      begin
        uri = URI("http://localhost:#{port}#{path}")
        response = Net::HTTP.get_response(uri)

        if response.code == "200"
          file_path = "public/#{filename}"

          FileUtils.mkdir_p(File.dirname(file_path))
          # Force encoding to UTF-8 to handle potential encoding issues
          content = response.body.force_encoding('UTF-8')
          File.write(file_path, content)
          puts "Generated: #{file_path}"
        else
          puts "Error generating #{path}: HTTP #{response.code}"
        end
      rescue => e
        puts "Error generating #{path}: #{e.message}"
      end
    end

    # Stop Rails server
    begin
      Process.kill("TERM", server_pid)
      Process.wait(server_pid)
    rescue
      # Server might have already stopped
    end

    # Clean up log file
    File.delete("server.log") if File.exist?("server.log") rescue nil

    puts "Static site generation complete!"
  end
end
