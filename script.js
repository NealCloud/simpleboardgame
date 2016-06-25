(function ($){
    
  function Checkers(){
      
      var gameScope = this,
      playerTurn = 0, //current player 
      gameTurn = 0,  //not yet used
      board = [],  //nest board array of cell objects
      boardArea = '', //board id for html div
      gamePieces = {}, //object holds gamepiece objects
      players = ['player1', "player2"], //amount of players
      playerIcon = {player1: '.blue', player2: '.red'}, //player colors
      attacking = false, //flag if current player has attacked
      pieceDragging = ''; //current piece being dragged
      //initialize game set boardarea and size
      function init(config){
          console.log('game intialized Blue is player1');
          boardArea = '#' + config.board;
          var width = 100/config.size;
          var height = 100/config.size + 1;                 
          boardCreate(config.size);
          $(".cell").css({"width": width + "%", "height": height + "%"});
      }
      //starts game with player 1 triggered by button
      function start(){
          console.log(players[playerTurn] + ' start');
          turnBegin(playerIcon[players[playerTurn]]);
          $('#start').hide();
      }    
      //Constructor for a board Cell Object
      function Cell(color, pos, piece){
          this.color = color;
          this.position = {row: pos.row, col: pos.col};
          this.currentPiece = piece;
          this.html = $('<div>', {
              class: color + ' ' + 'cell',
              id: pos.row + '-' + pos.col
          })               
      }      
      //Create the board
      function boardCreate(width, height){
          //create each cell and append to board as a nested array
          for(var i = 0; i < width; i++){
              var boardRow = [];
              for(var j = 0; j < width; j++){
                  if((j + i) % 2 === 0){
                      boardRow.push(new Cell('white', {row: i, col: j}));
                  }
                  else{   
                      //only black squares take pieces so put them in at start and end
                      var currentSpot = j + (i * width);
                      if(board.length < (width/2 - 1) ){
                         gamePieces['piece' + currentSpot] = new Piece('blue', {row: i, col: j}, 'piece' + currentSpot);
                          boardRow.push(new Cell('black', {row: i, col: j},gamePieces['piece' + currentSpot] ));
                         
                      }
                      else if(board.length > (width/2)){
                         gamePieces['piece' + currentSpot] =  new Piece('red', {row: i, col: j}, 'piece' + currentSpot);
                          boardRow.push(new Cell('black', {row: i, col: j}, gamePieces['piece' + currentSpot]));
                      }
                      else{
                          boardRow.push(new Cell('black', {row: i, col: j}, null));
                      }
                  }
              }
              //append a row to game board div
              board.push(boardRow);
              //after row is pushed go through and append each cell to the page 
              for(var k = 0; k < board[i].length; k++){
                  $(boardArea).append(board[i][k].html);
              }                  
          }
          placePieces(); 
      }      
        // loop through the Game pieces object and call the method to place them
      function placePieces(color, pos){
          for(var key in gamePieces){
              gamePieces[key].placePiece();
          }
      }
      //Game Piece constructor
      function Piece(color, pos, spot){        
        var pieceScope = this;            
        this.color = color;
        this.type = 'pawn';        
        this.html = $('<div>',{
            class: 'piece ' + color,
            id: spot            
        });            
        this.position = pos;        
      }
      
       Piece.prototype.placePiece = function(){            
            $(board[this.position.row][this.position.col].html).append(this.html);
        }
       
       Piece.prototype.changePosition = function(newpos){
            this.position = newpos;            
        }     
      
       //Game Logic Area
      //makes current players pieces moveable   
      function turnBegin(elemTarget){
           pieceDragging = elemTarget; //set the current element being dragged
           //make it draggable and call moveCheck when a piece is moved
           $( elemTarget ).draggable({
              revert : 'invalid',
               stop: function(){removeDrops()},
              accept: '.black',
              contain: '#board',
              start: moveCheck,
              zIndex: 100
          });
      }
      //Cycle through players array
      function nextPlayer(){
           if(++playerTurn >= players.length){
               playerTurn = 0;
           }
           turnBegin(playerIcon[players[playerTurn]]);
           console.log(players[playerTurn] +' Turn!');
      }
      //skip a turn
       function skipPlayer(elem){          
           turnBegin(elem);
           console.log('It\'s still ' + players[playerTurn] +'s Turn!');
      }
      //Called when a turn begins and a piece is moved      
      function moveCheck(event, ui){  
        //grab the object of piece being moved
        var curpiece = gamePieces[$(event.target).attr("id")];
        //check which cells it can move to and set them to .moveHere       
        directionCheck(curpiece);          
        //what happens when its dropped on a cell
        $(".moveHere" ).droppable({
            drop: function( event, ui ) {
                //grab the cell id which contains the row and col of the cell being dropped on
                var targCell = $(event.target).attr("id").split('-');                
                //use the split id to grab the target cell object in the board array               
                var curcell = board[targCell[0]][targCell[1]];
                //grab the cell object the game piece came from 
                var prevcell = board[curpiece.position.row][curpiece.position.col];
                //set the previous cell object game piece holder to null
                prevcell.currentPiece = null;
                //update the current game piece position row and col 
                curpiece.changePosition({row: parseInt(targCell[0]), col: parseInt(targCell[1])});
                //update the current cell game piece holder to current game piece
                curcell.currentPiece = curpiece;
                //destroy the ability to drag all game pieces
                $(pieceDragging).draggable("destroy");
                //check if player is at the end rows and king him if true
                if(curcell.position.row == 0 || curcell.position.row == board.length - 1){
                    curpiece.type = 'king';
                }
                 //check if the move was greater than one row;
                //if true find the piece between it and remove it and update affected cell 
                // also attack mode enabled so player can only move the same piece to attack in follow up moves
                if(Math.abs(prevcell.position.row - curcell.position.row) > 1 ){
                    attacking = true;
                    //find the mid cell by finding the largest row and col and subtracting 1
                    var rowMid = Math.max(prevcell.position.row, curcell.position.row) - 1;
                    var colMid = Math.max(prevcell.position.col, curcell.position.col) - 1;
                    var attackedCell = board[rowMid][colMid];
                    var attackedPiece = attackedCell.currentPiece; 
                    console.log(players[playerTurn] + ' has attcked cell ' , attackedCell);
                    //update and remove piece in attacked cell
                    attackedCell.currentPiece = null;
                    attackedPiece.html.remove();
                    attackedPiece = null;                    
                }
                //if player didn't attack end turn else engage attack mode draggable
                if(!attacking){                    
                    nextPlayer();                   
                }
                else{
                    //you can't call draggable on an element that is currently being dragged in the drop function
                    //so had to create a timeout to reapply the draggable to limit one piece moving
                    setTimeout( function(){
                        //set to only current piece can be dragged
                        skipPlayer('#' + curpiece.html.attr('id'));
                        directionCheck(curpiece);
                    }, 100);                               
                }                
                //remove all the droppable cells
                removeDrops();               
           }            
        });
      }
      //check where a piece can move to based on type or color      
      function directionCheck(piece){
          //create a series of checks depending on game Piece properties
          var vectorCheck = [];
          var movesCheck = 0;
          if(piece.type == 'king'){
             vectorCheck = [[1, 1],[1, -1],[-1, 1],[-1,-1]];
          }
          else if(piece.color == 'blue'){              
              vectorCheck.push([1, 1],[1, -1]);
          }
          else if(piece.color == 'red'){              
              vectorCheck.push([-1, 1],[-1, -1]);
          } 
          //loop through choosen vector array to check the cells status
          for(var i = 0; i < vectorCheck.length; i++){
              var row = piece.position.row + vectorCheck[i][0];
              var col = piece.position.col + vectorCheck[i][1];
              if(inboardCheck(row, col)) continue; //check if in bounds of the board
              var posCell = board[row][col];
              //check if cell can be moved to and add up possible moves;
              movesCheck += moveableCell(piece, posCell, {row:vectorCheck[i][0], col:vectorCheck[i][1]}) ? 1 : 0;            
          }
         //console.log('moves possible ' + movesCheck);
          //if attack mode on checks if any possible moves so can end turn or wait
          if(attacking && movesCheck == 0){
            attacking = false;
            $(pieceDragging).draggable("destroy");
            nextPlayer();                  
            removeDrops();                          
          }
      }
      //check if board is occupied and by which piece 
      //and if you have attacked already to decide next move           
      function moveableCell(piece, cell, vec){
          if(cell.currentPiece == null && !attacking){
            $(cell.html).addClass('moveHere');
              return true;
          }
          else if(cell.currentPiece == null && attacking){
              return false;
          }
          else if(cell.currentPiece.color == piece.color){
              return false;              
          }
          //check if an attack is possible
          else if(cell.currentPiece.color != piece.color){
             return attackCell(piece, cell, vec);
          }              
      }
      
      function attackCell(piece, cell, vec){
          var row = cell.position.row + vec.row;
          var col = cell.position.col + vec.col;
          //check if cell inside board area - return if out of bounds
          if(inboardCheck(row,col)){return false};
          //grab new cell attack move area
          var aCell = board[row][col];
          //if cell is empty create a droppable cell
          if(aCell.currentPiece == null){
             $(aCell.html).addClass('moveHere');
              return true;
          }
      }      
      //remove all droppable cell areas and highlights
      function removeDrops(){
          $('.moveHere').droppable('destroy');
          $('.moveHere').removeClass('moveHere');
      }
      //check if the row and col params are within the board boundaries
      function inboardCheck(row, col){
          return (row > board.length - 1 || row < 0 || col > board.length - 1 || col < 0) ? true: false;
      }      
      //Debugging test function for console use
      function test(){
          console.log(board, gamePieces);
          console.log('draggin ' + pieceDragging);
      }
      //The Checkers Game Module
      return{
            start: start,
            init: init,
            test: test
      }
  };    
  //game manager
  function GameManager(config, buttons){
    var game = new Checkers(),
        start = buttons[0];
        
    this.test = game.test;  
    game.init(config);       
        
    $("#" + start).click(function(){        
            game.start();
        });               
    } 
   //assigns game to the global automatically
   $(document).ready(function(){   
        window.checkEms = new GameManager({size:6, board:'board'}, ['start']);
   })     
})(jQuery);





