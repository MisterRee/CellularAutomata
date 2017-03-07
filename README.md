# CellularAutomata
A Javascript browser based example of cellular automata, with Audio featured sprinkled in.

##Currently, the audio is loud and obnoxious. Be careful with loud speakers/earbuds.

[Client-Only Demo](https://people.rit.edu/dxl1720/ComputationalAesthetics/AudioCA/audioCA.html)

#### Click to change your mouse-over color!

This example roughly follows the [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life). This page fills the screen with grids which follows Conway's rules for his set of cellular automata. However instead of cells having a binary 'alive or dead' state, living cells merely darken its cell gradually instead of instantly. The same goes for the opposite; 'dead' cells gradually lighten the cell color over time. Specifically, these iterations change the original second rule of the set from:

> Any live cell with two or three live neighbours lives on to the next generation.

To a much more occuring rule:

> Any live cell with less than one or greater than four neighbors lives on to the next generation.

The cells are only grayscale from black to white by the automata. When the mouse is moved over the cells, they are painted to a randomly generated color. The colors left behind your mouse will decay into white, and may create new colors along the decay cycle.

In the live heroku demo, other users connected to the socket will be able to interact with the same automata in real time. Every user rolls a different color so collaboration can create some living art as it lives and dies over time.

The page will output steady, sine-wave beeps at each iteration of the cell automation. The amount of cells that turn alive account for the frequency of the signal.

Mousing over and influncing the page will change the signal as well, in different ways depending on the colors splashed to the cells.
> Red cells will detune the signal;

> Green cells will change the lowpass frequency that is being applied to the signal;

> Blue cells will also change the frequency of the base signal;
