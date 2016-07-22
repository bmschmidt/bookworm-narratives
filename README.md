Embryonic attempt to build a narrative scroller interface to the bookworm API for telling stories

See example at [benschmidt.org/bookworm-narratives/libraries.html](benschmidt.org/bookworm-narratives/libraries.html)

I've used the general strategy and code from [Jim Vallandingham](http://vallandingham.me/scroller.html), but made several changes. Most
notably, instead of spreading the functions and HTML out through the document and handling updates as needed, I use a central library to handle and clear the chart, and store the narrative as a json file that can be easily swapped out to separate out writing a story from handling the HTML.

JSON is a terrible format to write in, so I might switch to YAML or something eventually. Markdown is inconvenient, unfortunately, because it doesn't play well with `div` elements in HTML which are super-important for a scroller interface.

Eventually this should be integrated with some methods for updating the charts on the user end.
