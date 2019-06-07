/* This code is pretty sloppy right now. Sorry for the mess. */

function showAbout() {
	alert("This training tool is designed to help learn the movement required for the Sotetseg maze from the Theatre of Blood in Oldschool Runescape. " +
		"You can share mazes by copy/pasting the seed into the Edit Seed prompt. " +
		"Special thanks to Ardames, De0, and Hato for advice on the game's mechanics. " +
		"Additional thanks to Define_Alive, LucidDream, SNIPERBDS, xZact, and the WeDoRaids discord for sharing mazes from which I could establish rules for maze generation.");
}

const FPS = 50;
const delta_time   = 1000 / FPS;

const tick_length  = 600;

const maze_width   = 14;
const maze_height  = 15;
const max_x_change = 5;
const path_turns   = 8;

const tile_size    = 40;
const tile_stroke  = tile_size/25;
const color_mazeback = "#323232";
const color_tilepath = "#961919";
const color_tilenogo = "#C8C8C8";
const color_tileplay = "#77DD77";
const color_tilenext = "#C8C8C8";
const color_tilesolv = "#6495ED";
const color_linesolv = "#FFFF00";
const color_circpass = "#008000";
const color_circfail = "#DC143C";
const solv_font      = "Arial";
const solv_fontsize  = 15;

var canvas = document.getElementById("sotetseg-maze");
var ctx = canvas.getContext("2d");
canvas.width = tile_size * maze_width;
canvas.height = tile_size * maze_height;

class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

function getTileClicked(event) {
	var rect = canvas.getBoundingClientRect();
	var pixel_x = event.clientX - rect.left;
	var pixel_y = event.clientY - rect.top;
	var tile_x = Math.floor(pixel_x / tile_size);
	var tile_y = Math.floor(pixel_y / tile_size);
	return { x: tile_x, y: tile_y };
}

function randRange(a, b) {
	return Math.floor(Math.random() * (b - a + 1)) + a;
}

function drawPathTile(x, y) {
	let pos_x = tile_size * x;
	let pos_y = tile_size * y;
	ctx.fillStyle = maze[x][y] ? color_circpass : color_circfail;
	ctx.beginPath(pos_x, pos_y, pos_x+tile_size, pos_y+tile_size);
	ctx.arc(pos_x+tile_size/2, pos_y+tile_size/2, tile_size/3.4, 0, 2*Math.PI);
	ctx.fill();
}

function drawTargetTile(x, y) {
	let pos_x = tile_size * x;
	let pos_y = tile_size * y;
	ctx.fillStyle = color_tilesolv;
	ctx.fillRect(pos_x, pos_y, tile_size, tile_size);
	ctx.fillStyle = color_mazeback;
	ctx.fillRect(
		pos_x + tile_stroke,
		pos_y + tile_stroke,
		tile_size - tile_stroke * 2,
		tile_size - tile_stroke * 2
	);
	ctx.beginPath(pos_x, pos_y, pos_x+tile_size, pos_y+tile_size);
	ctx.arc(pos_x+tile_size/2, pos_y+tile_size/2, tile_size/3.4, 0, 2*Math.PI);
	ctx.lineWidth = tile_stroke*1.2;
	ctx.strokeStyle = color_tilesolv;
	ctx.stroke();
}

function drawMazeTile(x, y, color_tile) {
	let pos_x = tile_size * x;
	let pos_y = tile_size * y;
	ctx.fillStyle = color_tile;
	ctx.fillRect(pos_x, pos_y, tile_size, tile_size);
	ctx.fillStyle = color_mazeback;
	ctx.fillRect(
		pos_x + tile_stroke,
		pos_y + tile_stroke,
		tile_size - tile_stroke * 2,
		tile_size - tile_stroke * 2
	);
	ctx.beginPath(pos_x, pos_y, pos_x+tile_size, pos_y+tile_size);
	ctx.arc(pos_x+tile_size/2, pos_y+tile_size/2, tile_size/3.4, 0, 2*Math.PI);
	ctx.lineWidth = tile_stroke*1.2;
	ctx.strokeStyle = color_tile;
	ctx.stroke();
}

function drawMaze() {
	for (var x = 0; x < maze.length; x++) {
		for (var y = 0; y < maze[x].length; y++) {
			drawMazeTile(x, y, maze[x][y] ? color_tilepath : color_tilenogo);
		}
	}
}

function pathWeighting() {
	weighted_maze = Array(maze_width);
	for (let x = 0; x < maze_width; x++) {
		weighted_maze[x] = Array(maze_height);
		for (let y = 0; y < maze_height; y++) {
			weighted_maze[x][y] = 0;
		}
	}
	let t_pos = new Point(-1, -1);
	let p_pos = new Point(-1, -1);
	let c_pos = new Point(seed[0], maze_height - 1)
	counter = 1;
	while (c_pos) {
		weighted_maze[c_pos.x][c_pos.y] = counter
		counter += 1
		t_pos.x = p_pos.x;
		t_pos.y = p_pos.y;
		p_pos.x = c_pos.x;
		p_pos.y = c_pos.y;
		c_pos = getNextPathTile(c_pos, t_pos);
	}
}

function makeSeededMaze(seed) {
	let maze = new Array(maze_width);
	for (var x = 0; x < maze.length; x++) {
		maze[x] = new Array(maze_height);
	}
	for (var x = 0; x < maze.length; x++) {
		for (var y = 0; y < maze[x].length; y++) {
			maze[x][y] = false;
		}
	}
	var next_x = -1;
	var s = 0;
	var x = seed[s];
	var y = maze[0].length - 1;
	while (y >= 0) {
		if (y % 2) {
			next_x = seed[++s];
			for (var i = Math.min(x, next_x); i <= Math.max(x, next_x); i++) {
				maze[i][y] = true;
			}
			x = next_x;
		} else {
			maze[x][y] = true;
		}
		y--;
	}
	start_pos = new Point(seed[0], maze_height - 1);
	end_pos = new Point(seed[seed.length - 1], 0);
	return maze;
}

function makeSeed() {
	seed = new Array(path_turns);
	seed[0] = randRange(0, maze_width - 1);
	for (var i = 1; i < seed.length; i++) {
		seed[i] = randRange(Math.max(seed[i-1] - max_x_change, 0), Math.min(seed[i-1] + max_x_change, maze_width - 1));
	}
}

function makeMaze() {
	makeSeed();
	return makeSeededMaze(seed);
}

function connectPoints(points, color) {
	ctx.beginPath();
	for (var i = 0; i < points.length - 1; i++) {
		ctx.moveTo(points[i].x * tile_size + tile_size / 2, points[i].y * tile_size + tile_size / 2);
		ctx.lineTo(points[i + 1].x * tile_size + tile_size / 2, points[i + 1].y * tile_size + tile_size / 2);
	}
	ctx.lineWidth = Math.round(tile_stroke * 1.5);
	ctx.strokeStyle = color;
	ctx.stroke();
}

function drawstalledTiles() {
	for (var i = 0; i < stalled_tiles.length; i++) {
		drawMazeTile(stalled_tiles[i].x, stalled_tiles[i].y, color_linesolv);
	}
}

function drawPassedTiles() {
	for (var i = 0; i < path_taken.length; i++) {
		drawPathTile(path_taken[i].x, path_taken[i].y);
	}
}

function drawText() {
	ctx.textAlign = "center";
	ctx.fillStyle = "#FFFFFF";
	for (let x = 0; x < maze_width; x++) {
		for (let y = 0; y < maze_height; y++) {
			if (maze[x][y]) {
				ctx.fillText(`(${weighted_maze[x][y]})`, x*tile_size + tile_size*0.5, y*tile_size + tile_size*0.5);
			}
		}
	}
}

function drawCoords() {
	ctx.textAlign = "center";
	ctx.fillStyle = "#FFFFFF";
	for (let x = 0; x < maze_width; x++) {
		for (let y = 0; y < maze_height; y++) {
			if (maze[x][y]) {
				ctx.fillText(`(${x}, ${y})`, x*tile_size + tile_size*0.5, y*tile_size + tile_size*0.5);
			}
		}
	}
}

function isValidMove(current_tile, target_tile) {
	if (target_tile.x < 0 || target_tile.x > maze_width - 1) { // x overflow
		return false;
	}
	if (target_tile.y < 0 || target_tile.y > maze_height - 1) { // y overflow
		return false;
	}
	if (!maze[target_tile.x][target_tile.y]) { // tile clicked is not safe
		return false;
	}
	let move_passed_tiles = getPassedTiles(current_tile, target_tile);
	for (let i = 0; i < move_passed_tiles.length; i++) {
		if (!maze[move_passed_tiles[i].x][move_passed_tiles[i].y]) {
			return false;
		}
	}
	return true;
}

function solveMaze() {
	optimal_moves = Array();
	optimal_moves.push(new Point(start_pos.x, start_pos.y));
	while (optimal_moves[optimal_moves.length - 1].y > 0) {
		let c = new Point(optimal_moves[optimal_moves.length - 1].x, optimal_moves[optimal_moves.length - 1].y);
		let possible_moves = [             // we only care about tiles ahead of us (i.e. not south)
			new Point(c.x - 2, c.y - 2),   // row of 5 tiles, 2 rows north of current position
			new Point(c.x - 1, c.y - 2),
			new Point(c.x, c.y - 2),
			new Point(c.x + 1, c.y - 2),
			new Point(c.x + 2, c.y - 2),
			new Point(c.x - 2, c.y - 1),   // row of 5 tiles, 1 row north of current position
			new Point(c.x - 1, c.y - 1),
			new Point(c.x, c.y - 1),
			new Point(c.x + 1, c.y - 1),
			new Point(c.x + 2, c.y - 1),
			new Point(c.x - 2, c.y),       // row of 4 tiles (not including our current position) in the current row
			new Point(c.x - 1, c.y),
			new Point(c.x + 1, c.y),
			new Point(c.x + 2, c.y)
		];
		for (let i = 0; i < possible_moves.length; i++) {
			if (!isValidMove(c, possible_moves[i])) {
				possible_moves.splice(i, 1);
				i--;
			}
		}
		let best_move = new Point(-1, -1);
		let best_move_score = -1;
		for (let i = 0; i < possible_moves.length; i++) {
			if (weighted_maze[possible_moves[i].x][possible_moves[i].y] > best_move_score) {
				best_move = new Point(possible_moves[i].x, possible_moves[i].y);
				best_move_score = weighted_maze[possible_moves[i].x][possible_moves[i].y];
			}
		}
		optimal_moves.push(new Point(best_move.x, best_move.y));
	}
}

function drawSolution() {
	ctx.textAlign = "center";
	ctx.fillStyle = "#FFFFFF";
	ctx.font = `${solv_fontsize}px ${solv_font}`;
	for (let i = 0; i < optimal_moves.length; i++) {
		ctx.fillText(`${i+1}`, optimal_moves[i].x*tile_size + tile_size*0.5, optimal_moves[i].y*tile_size + tile_size*0.5 + solv_fontsize*0.3);
	}
}

function getNextPathTile(c_pos, o_pos) {
	let neighbors = Array(4);
	neighbors[0] = new Point(c_pos.x, c_pos.y + 1);
	neighbors[1] = new Point(c_pos.x + 1, c_pos.y);
	neighbors[2] = new Point(c_pos.x, c_pos.y - 1);
	neighbors[3] = new Point(c_pos.x - 1, c_pos.y);
	for (let i = 0; i < neighbors.length; i++) {
		if (neighbors[i].x < 0 || neighbors[i].x >= maze_width) {
			continue;
		}
		if (neighbors[i].y < 0 || neighbors[i].y >= maze_height){
			continue;
		}
		if (maze[neighbors[i].x][neighbors[i].y] == false) {
			continue;
		}
		if (o_pos.x == neighbors[i].x && o_pos.y == neighbors[i].y) {
			continue;
		}
		return neighbors[i];
	}
	return null;
}

function editSeed() {
	var savestate = prompt("Enter a seed", seed.join(" "));
	savestate = savestate.split(' ').map(Number);
	if (savestate.length != path_turns || Math.max(savestate) >= maze_width || Math.min(savestate) < 0) {
		alert("Bad seed");
		return;
	}
	seed = savestate;
	reset();
}

function getPassedTiles(previous, target) {
	let current = new Point(previous.x, previous.y);
	let result = new Array();
	while (result.length < 2 && !(current.x == target.x && current.y == target.y)) {
		let movement_vector = new Point(target.x - current.x, target.y - current.y);
		if (Math.abs(movement_vector.x) == Math.abs(movement_vector.y)) { // diagonal
			current.x += (current.x < target.x ? 1 : -1);
			current.y += (current.y < target.y ? 1 : -1);
		} else if (Math.abs(movement_vector.x) > Math.abs(movement_vector.y)) {
			current.x += (current.x < target.x ? 1 : -1);
		} else {
			current.y += (current.y < target.y ? 1 : -1);
		}
		result.push(new Point(current.x, current.y));
	}
	return result;
}

canvas.addEventListener('mousedown', function (event) {
	let clickedTile = getTileClicked(event);
	targeted_tile = new Point(clickedTile.x, clickedTile.y);
	drawState();
	if (moves.length == 0 && !session_active) {
		session_active = true;
		player_position = new Point(start_pos.x, start_pos.y + 1); // start off-screen, 1 tile below first maze tile
		path_taken.push(targeted_tile);
		timerTick = setInterval(gameTick, tick_length);
	}
});

function drawState() {
	drawMaze();
	drawstalledTiles();
	drawPassedTiles();
	if (!(player_position.x == targeted_tile.x && player_position.y == targeted_tile.y)) {
		drawTargetTile(targeted_tile.x, targeted_tile.y);
	}
}

function writePar() {
	document.getElementById("par").innerHTML = `Best possible time: ${(optimal_moves.length * tick_length/1000).toFixed(1)} seconds (${optimal_moves.length} ticks)`;
}

function writeTime() {
	document.getElementById("timer").innerHTML = `${(ticks * tick_length/1000).toFixed(1)} seconds (${ticks} ticks, ${ticks_stalled} stalled)`;
}

function gameTick() {
	if ((player_position.x == targeted_tile.x && player_position.y == targeted_tile.y)) {
		ticks_stalled += 1;
		stalled_tiles.push(new Point(player_position.x, player_position.y));
	}
	ticks += 1;
	let new_tiles = getPassedTiles(player_position, targeted_tile);
	for (let i = 0; i < new_tiles.length; i++) {
		path_taken.push(new_tiles[i]);
	}
	player_position = new Point(path_taken[path_taken.length - 1].x, path_taken[path_taken.length - 1].y);
	if (player_position.y == 0) {
		session_active = false;
		clearInterval(timerTick);
	}
	drawState();
	writeTime();
}

function gameFrame() {
	drawState();
}

function resetvars() {
	ticks = 0;
	ticks_stalled = 0;
	stalled_tiles = new Array();
	path_arr= new Array();
	session_active = false;
	clearInterval(timerTick);
	moves = new Array();
	player_position = new Point();
	targeted_tile = new Point();
	path_taken = new Array();
}

function newSession() {
	resetvars();
	maze = makeMaze();
	pathWeighting();
	solveMaze();
	drawMaze(maze);
	writePar();
	writeTime();
}

function reset() {
	resetvars();
	maze = makeSeededMaze(seed);
	pathWeighting();
	solveMaze();
	drawMaze(maze);
	writePar();
	writeTime();
}

var start_pos;
var end_pos;
var ticks;
var ticks_stalled;
var stalled_tiles;
var timerTick;
var session_active;
var seed;
var maze;
var weighted_maze;
var moves;
var optimal_moves;
var player_position;
var targeted_tile;
var path_taken;
var path_arr;

newSession();
