function Stacker(){

var
EMPTY = 0,
WALL = 1,
BLOCK = 2,
GOLD = 3;

// coordinates
var x = 0; // number of row
var y = 0; // number of col

// board storing coordinates as the key and type,level as the value
var board = {};
// step back trace
var stepbacks = [];
// gold position
var gold = {};
// sorted tiles
var sortedtiles = [];

// stairs tiles
var stairtiles = [];
var stairUpStairs = [];
var stairDownStairs = [];
var stairlevel = 1; 

var pathforward = [];
var pathreverse = [];


// indicators
var carry = false; // show whether picked up a block  
var foundpath = false;
var startbuild = false;
var forward = true;

// Replace this with your own wizardry
this.turn = function(cell){
    
    //////////////////// if get gold, pickup //////////////////////////////////////////////////////
    if(stairlevel == 7)         // if reach level 7, go upstair to 8
    {
        return stairUpStairs[0];
    }
    if(cell.type == GOLD)
    {
        return "pickup";
    }
    
    //////////////////// DFS traverse the graph and store information in board ///////////////////

    // record the information of the current cell in board
    if( !([x,y] in board))
    {
        board[[x,y]] = {type: cell.type, level: cell.level, row: x, col: y};
    }

    // put all researchable adjacents in adjacent[] 
    var adjacent = [];
    for(var key in cell)
    {
        // if adjacent is gold, write information in object: gold  
        if( cell[key].type == GOLD && !gold.hasOwnProperty("position"))
        {
            switch(key)
            {
                case "left":
                    gx = x;
                    gy = y-1;
                    break;
                case "up":
                    gx = x-1;
                    gy = y;
                    break;
                case "right":
                    gx = x;
                    gy = y+1;
                    break;
                case "down":
                    gx = x+1;
                    gy = y;
                    break;
                default:
                    break;
            }
            gold["row"] = gx;
            gold["col"] = gy;
            gold["level"] = cell[key].level;
        }
        // tiles that are reachable 
        if((cell[key].type == EMPTY || cell[key].type == BLOCK) && Math.abs(cell[key].level - cell.level)<=1)
        {
            adjacent.push(key);
        }
    }
    
    // go to the tile, which is not visited
    for(var i in adjacent)
    {
        switch(adjacent[i])
        {
            case "left":
                if( !([x,y-1] in board))
                { 
                    y--;
                    stepbacks.push("right");
                    return "left";
                }
                break;
            case "up":
                if( !([x-1,y] in board))
                { 
                    x--;
                    stepbacks.push("down");
                    return "up";
                }
                break;
            case "right":
                if( !([x,y+1] in board))
                { 
                    y++;
                    stepbacks.push("left");
                    return "right";
                }
                break;
            case "down":
                if( !([x+1,y] in board))
                { 
                    x++;
                    stepbacks.push("up");
                    return "down";
                }
                break;
            default:
                break;
         }
    }

    // if all surrounded tiles are visited, step back
    if (stepbacks.length > 0) 
    {
        var step = stepbacks.pop()
        this.trackCoordinates(step)
        return step;
    }

 
    /////////////////////   determine the 7 tiles for building stairs (stairtiles)  ////////////////
    
    if(stairtiles.length == 0) 
    {
        // find out the closest tile
        var visited = [gold];
        stairtiles.push(gold);
        // find out other tiles for building blocks
        while(stairtiles.length < 30)
        {
            var ix = stairtiles[stairtiles.length-1].row;
            var iy = stairtiles[stairtiles.length-1].col;

            if(([ix, iy-1] in board) && !(visited.includes(board[[ix, iy-1]])))        // left
            {
                stairtiles.push(board[[ix, iy-1]]);
                visited.push(board[[ix, iy-1]]);
                stairUpStairs.push("right");
                stairDownStairs.unshift("left");
            }
            else if(([ix-1, iy] in board) && !(visited.includes(board[[ix-1, iy]])))   // up
            {
                stairtiles.push(board[[ix-1, iy]]);
                visited.push(board[[ix-1, iy]]);
                stairUpStairs.push("down");
                stairDownStairs.unshift("up");
            }
            else if(([ix, iy+1] in board) && !(visited.includes(board[[ix, iy+1]])))    // right
            {
                stairtiles.push(board[[ix, iy+1]]);
                visited.push(board[[ix, iy+1]]);
                stairUpStairs.push("left");
                stairDownStairs.unshift("right");
            }
            else if(([ix+1, iy] in board) && !(visited.includes(board[[ix+1, iy]])))    // down
            {
                stairtiles.push(board[[ix+1, iy]]);
                visited.push(board[[ix+1, iy]]);
                stairUpStairs.push("up");
                stairDownStairs.unshift("down");
            } 
            else
            {
                stairtiles.pop();
                stairUpStairs.pop();
                stairDownStairs.shift();
            }
        }
        
        // chop off extra tiles
        stairtiles.splice(7,30);
        stairUpStairs.splice(6,29);
        stairDownStairs.splice(0,23);

    }
    
    ////////////////////// sort the blocks according to the distances to 1st stair /////////////////
    // BFS from the first stair tile, put found blocks in sortedtiles (unshift) 
    if(sortedtiles.length == 0)
    {
        var queue = [[stairtiles[stairtiles.length-1],[],[]]];
        var visitedtiles = stairtiles.slice(0);
        while( (queue.length != 0) && (sortedtiles.length<28) )
        {
            var tile = queue.pop();
            var ix = tile[0].row;
            var iy = tile[0].col;
            var pathF = tile[1].slice(0);  // path from stair to tile
            var pathR = tile[2].slice(0);  // path from tile to stair
            
            
            if((tile[0].level == 1) && (pathF.length > 0)){
                sortedtiles.unshift(tile);
            }
            
            if(([ix, iy-1] in board) && !(visitedtiles.includes(board[[ix, iy-1]])))        // left
            {
                visitedtiles.push(board[[ix, iy-1]]);
                queue.unshift([board[[ix, iy-1]], ["left"].concat(pathF), pathR.concat(["right"])]);
            }
            if(([ix-1, iy] in board) && !(visitedtiles.includes(board[[ix-1, iy]])))   // up
            {
                visitedtiles.push(board[[ix-1, iy]]);
                queue.unshift([board[[ix-1, iy]], ["up"].concat(pathF), pathR.concat(["down"])]);
            }
            if(([ix, iy+1] in board) && !(visitedtiles.includes(board[[ix, iy+1]])))    // right
            {
                visitedtiles.push(board[[ix, iy+1]]);
                queue.unshift([board[[ix, iy+1]], ["right"].concat(pathF), pathR.concat(["left"])]);
            }
            if(([ix+1, iy] in board) && !(visitedtiles.includes(board[[ix+1, iy]])))    // down
            {
                visitedtiles.push(board[[ix+1, iy]]);
                queue.unshift([board[[ix+1, iy]], ["down"].concat(pathF), pathR.concat(["up"])]);
            } 
            
        }
        //alert("BFS done");

    }
    

    //////////////////////////////  from 0,0 go to first block ////////////////////////////////////
    if( !startbuild )
    {
        if( pathforward.length == 0 )
        {
            foundpath = false;
            var visitedpath = [board[[x,y]]];
            pathforward = this.findPath(board[[x,y]], sortedtiles[sortedtiles.length-1][0], visitedpath);
            pathforward.unshift("pickup"); 
        }
        startbuild = true;
        //alert("start building");

    }

    //////////////////////////////  move the blocks to build the stairs  //////////////////////////
    if( forward ) // to block
    {
      
        if( pathforward.length == 0 )  //if not carry and path is empty, find path and get block
        {
            // find path to sortedtiles[sortedtiles.length-1] closest block 
            pathforward = sortedtiles[sortedtiles.length-1][1].slice(0); // stair to block
            pathforward.unshift("pickup");                 
        }
        step = pathforward.pop();
        this.trackCoordinates(step);
        if(step == "pickup"){
            board[[x,y]].level--;
            forward = false;
        }
        return step;
    }
    else    // to stair
    {
        // find path to stair
        if( pathreverse.length == 0 ) // if pathreverse is empty, get pathreverse 
        {
            // find path to stairtiles[stairtiles.length-1] lowest stair tile
            pathreverse = sortedtiles[sortedtiles.length-1][2].slice(0);     // get path from block to stair 
            sortedtiles.pop();                                      // remove the one gotten
            pathreverse = stairUpStairs.concat(pathreverse);        // add stair trace after path
        }

        // after drop block go back to stair 1
        if( !carry )           // if not carry block, go down stairs
        {
            step = pathreverse.pop();
            this.trackCoordinates(step);
            if( pathreverse.length == 0)
            {
                forward = true;
            }
            return step;
        }
        else
        {
            // pathreverse: from block to stair
            if( (pathreverse.length <= (7-stairlevel)) && stairtiles[pathreverse.length].level<stairlevel)
            {
                // if it's on stairlevel and level<stairlevel drop block 
                board[[x,y]].level++;    // tile level +1
                carry = false;           // after drop, not carry
                var index = pathreverse.length;
                pathreverse = stairDownStairs.slice(0,6-index);  // clear path; put in path to first stair
                if(pathreverse.length == 0){
                    forward = true;
                }
                return "drop";
            }
            else if( (pathreverse.length == 1) && (stairlevel<=6) ) // if reach stair end, increase stairlevel
            {
                board[[x,y]].level++;
                carry = false;
                stairlevel++;
                var index = pathreverse.length;
                pathreverse = stairDownStairs.slice(0,6-index);
                return "drop";
            }
            else
            {
                step = pathreverse.pop();
                this.trackCoordinates(step);
                return step;
            }
        }
        
    }
    
}



///////////////// function for finding the path from currentTile to targetTile  //////////////////////

this.findPath = function(currentTile, targetTile, visitedpath){
    if( (currentTile.row == targetTile.row) && (currentTile.col == targetTile.col))
    {
        foundpath = true;
        return [];
    }
    else if( (targetTile.row == currentTile.row) && (targetTile.col < currentTile.col) )
    {
        var movedirs = ["left", "up", "down", "right"];
        for(var i in movedirs){
            var coords = this.getCoordinates(currentTile, movedirs[i]);
            var tmpdir = movedirs[i];
            if ( !(coords in board) || Math.abs(board[coords].level-currentTile.level)>1 || visitedpath.includes(board[coords]) )
            {
                continue;
            }
            var tmpvisitedpath = visitedpath.concat([board[coords]]);
            var tmppath = this.findPath(board[coords], targetTile, tmpvisitedpath);
            if( foundpath ){
                tmppath.push(tmpdir);
                return tmppath;
            }
        }
    }
    else if( (targetTile.row == currentTile.row) && (targetTile.col > currentTile.col) )
    {
        var movedirs = ["right", "up", "down", "left"];
        for(var i in movedirs){
            var coords = this.getCoordinates(currentTile, movedirs[i]);
            var tmpdir = movedirs[i];
            if ( !(coords in board) || Math.abs(board[coords].level-currentTile.level)>1 || visitedpath.includes(board[coords]) )
            {
                continue;
            }
            var tmpvisitedpath = visitedpath.concat([board[coords]]);
            var tmppath = this.findPath(board[coords], targetTile, tmpvisitedpath);
            if( foundpath ){
                tmppath.push(tmpdir);
                return tmppath;
            }
        }
    }
    else if( (targetTile.row < currentTile.row) && (targetTile.col == currentTile.col) )
    {
        var movedirs = ["up", "right", "left", "down"];
        for(var i in movedirs){
            var coords = this.getCoordinates(currentTile, movedirs[i]);
            var tmpdir = movedirs[i];
            if ( !(coords in board) || Math.abs(board[coords].level-currentTile.level)>1 || visitedpath.includes(board[coords]) )
            {
                continue;
            }
            var tmpvisitedpath = visitedpath.concat([board[coords]]);
            var tmppath = this.findPath(board[coords], targetTile, tmpvisitedpath);
            if( foundpath ){
                tmppath.push(tmpdir);
                return tmppath;
            }
        }
    }
    else if( (targetTile.row > currentTile.row) && (targetTile.col == currentTile.col) )
    {
        var movedirs = ["down", "right", "left", "up"];
        for(var i in movedirs){
            var coords = this.getCoordinates(currentTile, movedirs[i]);
            var tmpdir = movedirs[i];
            if ( !(coords in board) || Math.abs(board[coords].level-currentTile.level)>1 || visitedpath.includes(board[coords]) )
            {
                continue;
            }
            var tmpvisitedpath = visitedpath.concat([board[coords]]);
            var tmppath = this.findPath(board[coords], targetTile, tmpvisitedpath);
            if( foundpath ){
                tmppath.push(tmpdir);
                return tmppath;
            }
        }
    }
    else if( (targetTile.row < currentTile.row) && (targetTile.col < currentTile.col) )
    {
        var movedirs = ["up", "left", "down", "right"];
        for(var i in movedirs){
            var coords = this.getCoordinates(currentTile, movedirs[i]);
            var tmpdir = movedirs[i];
            if ( !(coords in board) || Math.abs(board[coords].level-currentTile.level)>1 || visitedpath.includes(board[coords]) )
            {
                continue;
            }
            var tmpvisitedpath = visitedpath.concat([board[coords]]);
            var tmppath = this.findPath(board[coords], targetTile, tmpvisitedpath);
            if( foundpath ){
                tmppath.push(tmpdir);
                return tmppath;
            }
        }
    }
    else if( (targetTile.row < currentTile.row) && (targetTile.col > currentTile.col) )
    {
        var movedirs = ["up", "right", "left", "down"];
        for(var i in movedirs){
            var coords = this.getCoordinates(currentTile, movedirs[i]);
            var tmpdir = movedirs[i];
            if ( !(coords in board) || Math.abs(board[coords].level-currentTile.level)>1 || visitedpath.includes(board[coords]) )
            {
                continue;
            }
            var tmpvisitedpath = visitedpath.concat([board[coords]]);
            var tmppath = this.findPath(board[coords], targetTile, tmpvisitedpath);
            if( foundpath ){
                tmppath.push(tmpdir);
                return tmppath;
            }
        }
    }
    else if( (targetTile.row > currentTile.row) && (targetTile.col < currentTile.col) )
    {
        var movedirs = ["down", "left", "up", "right"];
        for(var i in movedirs){
            var coords = this.getCoordinates(currentTile, movedirs[i]);
            var tmpdir = movedirs[i];
            if ( !(coords in board) || Math.abs(board[coords].level-currentTile.level)>1 || visitedpath.includes(board[coords]) )
            {
                continue;
            }
            var tmpvisitedpath = visitedpath.concat([board[coords]]);
            var tmppath = this.findPath(board[coords], targetTile, tmpvisitedpath);
            if( foundpath ){
                tmppath.push(tmpdir);
                return tmppath;
            }
        }
    }
    else
    {
        var movedirs = ["down", "right", "up", "left"];
        for(var i in movedirs){
            var coords = this.getCoordinates(currentTile, movedirs[i]);
            var tmpdir = movedirs[i];
            if ( !(coords in board) || Math.abs(board[coords].level-currentTile.level)>1 || visitedpath.includes(board[coords]) )
            {
                continue;
            }
            var tmpvisitedpath = visitedpath.concat([board[coords]]); 
            var tmppath = this.findPath(board[coords], targetTile, tmpvisitedpath);
            if( foundpath ){
                tmppath.push(tmpdir);
                return tmppath;
            }
        }
    }


}




///////////////////////////////  function for track coordinates   //////////////////////////////////
this.trackCoordinates = function(direction){
    switch(direction)
    {
        case "left":
            y--;
            break;
        case "up":
            x--;
            break;
        case "right":
            y++;
            break;
        case "down":
            x++;
            break;
        case "pickup":
            carry = true;
            break;
        case "drop":
            carry = false;
            break;
        default:
            break;
    }
    return true;
}


this.getCoordinates = function(tile, direction){
    switch(direction)
    {
        case "left":
            return [tile.row, tile.col-1];
            break;
        case "up":
            return [tile.row-1, tile.col];
            break;
        case "right":
            return [tile.row, tile.col+1];
            break;
        case "down":
            return [tile.row+1, tile.col];
            break;
        default:
            return [tile.row, tile.col];
            break;
    }
    return true;
}



}
