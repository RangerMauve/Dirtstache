Dirtstache
==========

This is a moustache-like templating engine that will hopefully support features that I found lacking in others

Tags:
-----

{{variable_name}}:
This is the most basic tag and is used to display a variable from the passed context. If it is a string, it is auto-escaped to avoid injection. If variable_name points to an object or string, or doesn't exist, it isn't rendered and an eror is output.

{variable_name}:
This is similar to the previous tag, but it doesn't escape the contents, use this if you want to add raw html somewhere. If variable_name points to an object or string, or doesn't exist, it isn't rendered and an error is output.

{^template_name}:
Looks for template_name in the cached templates and renders it with the current context. It's basically partials, but all templates can be used as partials. If template_name isn't found, the block is not renered and an error is output.

{#variable_name} & {{/variable_name}}:
If variable_name is an Object the block is rendered with it as the context. If variable_name is an array of objects, the block is rendered for each object with it being set as the context. If it is an array of primitive objects, the block is executed with "this" representing the current element.

{?variable_name} & {/variable_name}:
If variable_name is a truthy value, the block of code is rendered. Else it silently ignores it.

{!variable_name} & {/variable_name}:
Opposite of {?variable_name}. If variable_name is falsy, it is rendered.

{%javascript_expression%}:
Raw javascript between the {% and %} tags is executed. The result is rendered if not undefined. Very dangerous to use haphazardly because it can mess up the rendering.

Inheritance:
------------
Dirtstache supports an idea of inheritance so that you could inplement a layout or some similar thing.

{*parent_name}:
Must be first block in template. Specifies the name of the parent template. Only blocks that exist in the parent tempalte will be rendered.

{>block_name}:
Defines an area in the template where a block can be inserted.

{<block_name} & {/block_name:
Contents of block are rendered and inserted in the corresponding {>block_name} are in the parent template. 

ToDo:
-----
- Decide on what tags to support and what control structures there will be
- Parse out tags from template string
- Begin supporting tags and stuff
- Make demo of some tags
- Figure out how to make meaningful error messages
- Add detailed documentation for the tags
