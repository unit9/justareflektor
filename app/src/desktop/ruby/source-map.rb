require 'source_map'

    file = File.open("public/combined.js", "w")

    map = SourceMap.new(:generated_output => file,
                        :file => "combined.js",
                        :source_root => "http://localhost:3000/")

    Dir["js/*"].each do |filename|
      map.add_generated File.read(filename), :source => filename.sub('public/', '')
    end

    map.save("public/combined.js.map")