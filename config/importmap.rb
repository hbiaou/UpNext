# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
pin_all_from "app/javascript/services", under: "services"

# Database and services
pin "database", to: "database.js"

# Process polyfill for browser compatibility
pin "process", to: "https://cdn.skypack.dev/process@0.11.10"

# IndexedDB library for client-side data storage
pin "dexie", to: "https://cdn.skypack.dev/dexie@4.0.8"
