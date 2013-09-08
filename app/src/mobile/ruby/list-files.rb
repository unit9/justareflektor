module Sass::Script::Functions

    def listFiles(path, omitExtension)

        images_dir = "/../../../m/img/"
        extensionOmitter = ''

        if omitExtension.value
            extensionOmitter = '.*'
        end

        return Sass::Script::List.new(
            Dir.glob(File.dirname(__FILE__) + images_dir + path.value).map! { |x| Sass::Script::String.new(File.basename(x, extensionOmitter)) },
            :comma
        )

    end

end
