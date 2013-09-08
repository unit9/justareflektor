# Require any additional compass plugins here.
require File.join(File.dirname(__FILE__), 'ruby/list-files.rb')

# Set this to the root of your project when deployed:
http_path = "/"
css_dir = "../../m/css"
sass_dir = "sass"
images_dir = "../../m/img"
javascripts_dir = "../../m/js"
fonts_dir = "../../m/fonts"

output_style = :compressed
environment = :production

relative_assets = true

line_comments = false
color_output = false


# If you prefer the indented syntax, you might want to regenerate this
# project again passing --syntax sass, or you can uncomment this:
# preferred_syntax = :sass
# and then run:
# sass-convert -R --from scss --to sass sass scss && rm -rf sass && mv scss sass
preferred_syntax = :scss
