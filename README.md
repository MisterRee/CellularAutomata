# CellularAutomata
A Javascript browser based example of cellular automata

[Demo](https://people.rit.edu/dxl1720/ComputationalAesthetics/conwayMod.html)

This example currently follows the [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life). This page fills the screen with grids which follows Conway's rules for his set of cellular automata. However instead of cells having a binary 'alive or dead' state, living cells merely darken its cell gradually instead of instantly. The same goes for the opposite; 'dead' cells gradually lighten the cell color over time.

The cells are only grayscale from black to white by the automata. When the mouse is moved over cells, they are colored to a randomly generated color. The colors left behind your mouse will decay into white, and may create new colors along the decay cycle.

Clicking rerolls the randomized color. Repeatedly mixing colors together can create some unpredictable effects with interaction and automation.
