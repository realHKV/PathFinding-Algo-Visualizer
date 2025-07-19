class PathfindingVisualizer  {
    constructor() {
        this.gridSize = 25;
        this.grid = [];
        this.start = null;
        this.goal = null;
        this.currentMode = 'wall';
        this.currentAlgorithm = 'astar';
        this.isRunning = false;
        this.speed = 25;
        this.isDragging = false;
        this.isDrawing = false;
        this.startTime = 0;
        this.nodesVisited = 0;
        this.pathLength = 0;
                    
        this.initializeGrid();
        this.bindEvents();
        this.updateSpeedDisplay();
    }

    initializeGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        this.grid = [];

        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('mousedown', (e) => this.handleMouseDown(e));
                cell.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
                cell.addEventListener('mouseup', (e) => this.handleMouseUp(e));
                gridElement.appendChild(cell);
                        
                this.grid[row][col] = {
                    row: row,
                    col: col,
                    isWall: false,
                    isStart: false,
                    isGoal: false,
                    g: 0,
                    h: 0,
                    f: 0,
                    distance: Infinity,
                    parent: null,
                    visited: false,
                    element: cell
                };
            }
        }
        // Prevent text selection during drag
        document.addEventListener('selectstart', (e) => {
            if (this.isDragging) e.preventDefault();
        });
                
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isDrawing = false;
        });
    }

    bindEvents() {
        document.getElementById('wallMode').addEventListener('click', () => this.setMode('wall'));
        document.getElementById('startMode').addEventListener('click', () => this.setMode('start'));
        document.getElementById('goalMode').addEventListener('click', () => this.setMode('goal'));

        document.getElementById('astarBtn').addEventListener('click', () => this.setAlgorithm('astar'));
        document.getElementById('dijkstraBtn').addEventListener('click', () => this.setAlgorithm('dijkstra'));
        document.getElementById('bfsBtn').addEventListener('click', () => this.setAlgorithm('bfs'));
        document.getElementById('dfsBtn').addEventListener('click', () => this.setAlgorithm('dfs'));

        document.getElementById('clearBtn').addEventListener('click', () => this.clearGrid());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetPath());
        document.getElementById('speedSlider').addEventListener('input', (e) => this.updateSpeed(e.target.value));
    }

    handleMouseDown(e) {
        if (this.isRunning) return;
        this.isDragging = true;
        this.handleCellInteraction(e);
    }

    handleMouseEnter(e) {
        if (this.isRunning || !this.isDragging) return;
           this.handleCellInteraction(e);
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.isDrawing = false;
    }

    handleCellInteraction(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const cell = this.grid[row][col];

        if (this.currentMode === 'wall') {
            if (!cell.isStart && !cell.isGoal) {
                if (!this.isDrawing) {
                    this.isDrawing = !cell.isWall;
                }
                cell.isWall = this.isDrawing;
                cell.element.classList.toggle('wall', cell.isWall);
            }
        } else if (this.currentMode === 'start') {
            if (!cell.isWall && !cell.isGoal) {
                if (this.start) {
                    this.start.isStart = false;
                    this.start.element.classList.remove('start');
                }
                cell.isStart = true;
                cell.element.classList.add('start');
                this.start = cell;
            }
        } else if (this.currentMode === 'goal') {
            if (!cell.isWall && !cell.isStart) {
                if (this.goal) {
                    this.goal.isGoal = false;
                    this.goal.element.classList.remove('goal');
                }
                cell.isGoal = true;
                cell.element.classList.add('goal');
                this.goal = cell;
            }
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-buttons button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'Mode').classList.add('active');
    }

    setAlgorithm(algorithm) {
        this.currentAlgorithm = algorithm;
        document.querySelectorAll('.algorithm-buttons button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(algorithm + 'Btn').classList.add('active');
                
        this.resetPath();
        this.runAlgorithm();
    }

    updateSpeed(value) {
        this.speed = Math.max(0.5, (101 - value) / 2); // Range from 0.5ms to 50ms
        this.updateSpeedDisplay();
    }

    updateSpeedDisplay() {
        document.getElementById('speedValue').textContent = this.speed + 'ms';
    }
    

    clearGrid() {
        if (this.isRunning) return;
                
        this.start = null;
        this.goal = null;
        this.grid.forEach(row => {
            row.forEach(cell => {
                cell.isWall = false;
                cell.isStart = false;
                cell.isGoal = false;
                cell.g = 0;
                cell.h = 0;
                cell.f = 0;
                cell.distance = Infinity;
                cell.parent = null;
                cell.visited = false;
                cell.element.className = 'cell';
            });
        });
        this.updateStats(0, 0, 0);
        this.updateStatus('Click on the grid to place walls, start, or goal. Then click "Start A*" to begin!');
    }

    resetPath() {
        if (this.isRunning) return;
                
        this.grid.forEach(row => {
            row.forEach(cell => {
                cell.g = 0;
                cell.h = 0;
                cell.f = 0;
                cell.distance = Infinity;
                cell.parent = null;
                cell.visited = false;
                cell.element.classList.remove('open', 'closed', 'path');
            });
        });
        this.updateStats(0, 0, 0);
        this.updateStatus('Path reset. Ready to start A* algorithm!');
    }

    async runAlgorithm() {
        if (!this.start || !this.goal) {
            this.updateStatus('Please set both start and goal points!');
            return;
        }

        this.isRunning = true;
        this.startTime = performance.now();
        this.nodesVisited = 0;
        this.pathLength = 0;

        let result;
        switch (this.currentAlgorithm) {
            case 'astar':
                result = await this.aStar();
                break;
            case 'dijkstra':
                result = await this.dijkstra();
                break;
            case 'bfs':
                result = await this.bfs();
                break;
            case 'dfs':
                result = await this.dfs();
                break;
        }

        const endTime = performance.now();
        const timeTaken = Math.round(endTime - this.startTime);

        if (result) {
            await this.reconstructPath(result);
            this.updateStatus(`Path found! Algorithm: ${this.currentAlgorithm.toUpperCase()} 🎉`);
        } else {
            this.updateStatus(`No path found! Algorithm: ${this.currentAlgorithm.toUpperCase()} 😞`);
        }

        this.updateStats(timeTaken, this.nodesVisited, this.pathLength);
        this.isRunning = false;
    }
    async aStar() {
        const openSet = [this.start];
        const closedSet = [];
        this.start.g = 0;
        this.start.h = this.heuristic(this.start, this.goal);
        this.start.f = this.start.g + this.start.h;

        while (openSet.length > 0) {
            let current = openSet[0];
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < current.f) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }

            openSet.splice(currentIndex, 1);
            closedSet.push(current);
            this.nodesVisited++;

            if (!current.isStart && !current.isGoal) {
                current.element.classList.add('closed');
                current.element.classList.remove('open');
            }

            if (current === this.goal) {
                return current;
            }

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || closedSet.includes(neighbor)) {
                    continue;
                }

                const tentativeG = current.g + 1;

                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                    if (!neighbor.isStart && !neighbor.isGoal) {
                        neighbor.element.classList.add('open');
                    }
                } else if (tentativeG >= neighbor.g) {
                    continue;
                }

                neighbor.parent = current;
                neighbor.g = tentativeG;
                neighbor.h = this.heuristic(neighbor, this.goal);
                neighbor.f = neighbor.g + neighbor.h;
            }

            await this.sleep(this.speed);
        }

        return null;
    }

    async dijkstra() {
        const unvisited = [];
        this.start.distance = 0;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (!this.grid[row][col].isWall) {
                    unvisited.push(this.grid[row][col]);
                }
            }
        }

        while (unvisited.length > 0) {
            unvisited.sort((a, b) => a.distance - b.distance);
            const current = unvisited.shift();
                    
            if (current.distance === Infinity) break;
                    
            current.visited = true;
            this.nodesVisited++;
                    
            if (!current.isStart && !current.isGoal) {
                current.element.classList.add('closed');
            }

            if (current === this.goal) {
                return current;
            }

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || neighbor.visited) continue;
                    
                const alt = current.distance + 1;
                if (alt < neighbor.distance) {
                    neighbor.distance = alt;
                    neighbor.parent = current;
                            
                    if (!neighbor.isStart && !neighbor.isGoal) {
                        neighbor.element.classList.add('open');
                    }
                }
            }

            await this.sleep(this.speed);
        }

        return null;
    }

    async bfs() {
        const queue = [this.start];
        const visited = new Set();
        visited.add(this.start);
        this.start.visited = true;

        while (queue.length > 0) {
            const current = queue.shift();
            this.nodesVisited++;
                    
            if (!current.isStart && !current.isGoal) {
                current.element.classList.add('closed');
            }

            if (current === this.goal) {
                return current;
           }

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || visited.has(neighbor)) continue;
                    
                visited.add(neighbor);
                neighbor.visited = true;
                neighbor.parent = current;
                queue.push(neighbor);
                        
                if (!neighbor.isStart && !neighbor.isGoal) {
                    neighbor.element.classList.add('open');
                }
            }

            await this.sleep(this.speed);
        }

        return null;
    }

    async dfs() {
        const stack = [this.start];
        const visited = new Set();
        this.start.visited = true;

        while (stack.length > 0) {
            const current = stack.pop();
                    
            if (visited.has(current)) continue;
            visited.add(current);
            this.nodesVisited++;
                    
            if (!current.isStart && !current.isGoal) {
                current.element.classList.add('closed');
            }

            if (current === this.goal) {
                return current;
            }

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || visited.has(neighbor)) continue;
                        
                neighbor.parent = current;
                stack.push(neighbor);
                        
                if (!neighbor.isStart && !neighbor.isGoal) {
                    neighbor.element.classList.add('open');
                }
            }

            await this.sleep(this.speed);
        }

        return null;
    }

    getNeighbors(cell) {
        const neighbors = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // Up, Down, Left, Right
        ];

        for (const [dx, dy] of directions) {
            const newRow = cell.row + dx;
            const newCol = cell.col + dy;
            if (newRow >= 0 && newRow < this.gridSize && 
                newCol >= 0 && newCol < this.gridSize) {
                neighbors.push(this.grid[newRow][newCol]);
            }
        }

        return neighbors;
    }

    heuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }

    async reconstructPath(current) {
        const path = [];
        let pathCurrent = current;
        while (pathCurrent.parent) {
            path.unshift(pathCurrent);
            pathCurrent = pathCurrent.parent;
        }

        this.pathLength = path.length;

        for (const cell of path) {
            if (!cell.isGoal) {
                cell.element.classList.add('path');
            }
            await this.sleep(this.speed / 2);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    updateStats(time, nodes, pathLength) {
        document.getElementById('timeValue').textContent = time;
        document.getElementById('nodesValue').textContent = nodes;
        document.getElementById('pathLengthValue').textContent = pathLength;
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const visualizer = new PathfindingVisualizer();
    // Set A* as default active algorithm
    document.getElementById('astarBtn').classList.add('active');
});