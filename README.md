# CellularAutomata
A Javascript browser based example of cellular automata

[Live-Heroku Demo](https://cellularautomata.herokuapp.com/)

[Client-Only Demo](https://people.rit.edu/dxl1720/ComputationalAesthetics/conwayMod.html)

#### Click to change your mouse-over color!

This example roughly follows the [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life). This page fills the screen with grids which follows Conway's rules for his set of cellular automata. However instead of cells having a binary 'alive or dead' state, living cells merely darken its cell gradually instead of instantly. The same goes for the opposite; 'dead' cells gradually lighten the cell color over time. Specifically, these iterations change the original second rule of the set from:

> Any live cell with two or three live neighbours lives on to the next generation.

To a much more occuring rule:

> Any live cell with less than one or greater than four neighbors lives on to the next generation.

The cells are only grayscale from black to white by the automata. When the mouse is moved over the cells, they are painted to a randomly generated color. The colors left behind your mouse will decay into white, and may create new colors along the decay cycle.

In the live heroku demo, other users connected to the socket will be able to interact with the same automata in real time. Every user rolls a different color so collaboration can create some living art as it lives and dies over time.
