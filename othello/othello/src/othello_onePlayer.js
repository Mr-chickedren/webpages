var canvas = document.getElementById("Canvas"); //setup canvas
var ctx = canvas.getContext("2d");  //setup context (drawing)

const cellnum = 8;  //number of cell (horizontal) (othello_board: 8*8)
var cellsize = canvas.width / cellnum;  //width of one cell
var heightmargin = 0;   //vartical margin
const MaxWindowSize = 800;  //screen size (max)
const CircleSizeRatio = 38/100; //the ratio of the circle to canvas_width
const LineWidthRatio = 3/100;    //the ratio of the line to canvas_width
var turn;   //current turn
var time = 0;   //current time
var clicknum = 0;   //clicks
var timer; //timer

const N = 3;
const NO_SCORE = -10000;
const INF = 100000;

//board's evaluation
const Board_Position = [
    [45, -11, 4, -1, -1, 4, -11, 45],
    [-11, -16, -1, -3, -3, -1, -16, -11],
    [4, -1, 2, -1, -1, 2, -1, 4],
    [-1, -3, -1, 0, 0, -1, -3, 1],
    [-1, -3, -1, 0, 0, -1, -3, 1],
    [4, -1, 2, -1, -1, 2, -1, 4],
    [-11, -16, -1, -3, -3, -1, -16, -11],
    [45, -11, 4, -1, -1, 4, -11, 45]
];

//color preset
var Color = {
    deep_black: "rgb(0,0,0)",   //線
    black:      "rgb(20,20,20)",//石
    white:      "rgb(250,250,250)",//石
    board_color:"rgb(65,65,65)",//盤面
    red:        "rgb(150,50,50)",   //置ける場所
    blue:       "rgb(50,100,150)"   //最後に置いた場所
};

//stone's color
const Stone = {
    none:   0,  //nothing
    white:  1,
    black:  -1
};

//board's condition
const CellCondition = {
    none:   0,  //there is nothing
    canput: 1,  //can be put
    put:    2   //just put it now
};

//condition(win or lose)
const Result = {
    win:    1,
    draw:   0,
    lose:   -1,
};

//pack (information of game)
var Info = {
    end:     false, //finish games
    exist_canput: true,
    result: Result.draw,    //win or lose (my)
    color: {
        my:     Stone.none,
        enemy:  Stone.none
    },
    point: {
        my: 0,
        enemy: 0
    },
    click_pos: {    //just click now (coordinate)
        x: 0,
        y: 0
    }
};

//class (cells)
class Cell{
    put_stone(_stone){      //put stone (arg: stone's color)
        this.stone = _stone;
    }
    set_condition(_condition){  //setup conditions (arg: CellCondition{none,canput,put})
        this.condition = _condition;
    }
    set_size(_size){    //setup size (arg: [number])
        this.size = _size;
    }

    //draw at this coordinate(posX,posY)
    disp(posX,posY){
        //lines
        ctx.beginPath();
        ctx.fillStyle = Color.deep_black;
        ctx.fillRect(posX, posY, this.size, this.size);

        //board's condition
        var style = Color.board_color;
        switch(this.condition){
            case CellCondition.none:
                style = Color.board_color;
                ctx.fillStyle = style;
                break;
            case CellCondition.canput:
                style = Color.red;
                ctx.fillStyle = style;
                break;
            case CellCondition.put:
                style = Color.blue;
                ctx.fillStyle = style;
                break;
        }

        ctx.fillRect(posX+LineWidthRatio*cellsize, posY+LineWidthRatio*cellsize,
            this.size-LineWidthRatio*cellsize*2,this.size-LineWidthRatio*cellsize*2);
        ctx.stroke();
        
        //stone color
        var cirle = new Path2D();
        cirle.arc(posX+(this.size/2),posY+(this.size/2),cellsize*CircleSizeRatio,0,2*Math.PI);
        switch(this.stone){
            case Stone.none:
                ctx.fillStyle = style; break;
            case Stone.white:
                ctx.fillStyle = Color.white; break;
            case Stone.black:
                ctx.fillStyle = Color.black; break;
        }
        ctx.fill(cirle)
    }
}


/*  below: To process  *******************************************************************/

//create cells
var cells = new Array(cellnum);
for(i=0; i<cellnum; i++){
    cells[i] = new Array(cellnum);
    for(j=0; j<cellnum; j++){
        cells[i][j] = new Cell();
    }
}
init();

//click process
canvas.onclick = function(event){
    var clientRect = this.getBoundingClientRect();
	var positionX = clientRect.left + window.pageXOffset;
	var positionY = clientRect.top + window.pageYOffset;

    var x = event.pageX - positionX;
    var y = event.pageY - positionY - heightmargin;

    Info.click_pos = {x: Math.floor(x / cellsize), y: Math.floor(y / cellsize)};
    
    var i = Info.click_pos.x;   //clicked coordinate x (integer)
    var j = Info.click_pos.y;   //clicked coordinate y (integer)

    if(Info.color.my == Color.white){
        //cpu process
        alpha_beta(cells, 0, turn, INF, INF);

        turn *= -1;
        update_conditions(cells);
        count_point();
        judge_flag();
        update_board();
        update_display_result();
    }

    //draw process
    if(judge_can_click(i, j) && !(cells[i][j].stone) && !Info.end){
        //my process
        cells[i][j].put_stone(turn);
        for(xi=-1; xi<2; xi++){
            for(yj=-1;yj<2;yj++){
                turn_stone(i, j, xi, yj);
            }
        }
        turn *= -1;
        update_conditions(cells);
        clicknum++;

        count_point();
        judge_flag();
        update_board();
        update_display_result();

        //cpu process
        alpha_beta(cells, 0, turn, INF, INF);

        turn *= -1;
        update_conditions(cells);
        count_point();
        judge_flag();
        update_board();
        update_display_result();
    }

    if(Info.end){
        clearInterval(timer);
    }
}

/*  under: define functions *************************************************************/

//init
function init(){
    for(i=0; i<cellnum; i++){
        for(j=0; j<cellnum; j++){
            cells[i][j].set_size(cellsize);
            cells[i][j].put_stone(Stone.none);
            cells[i][j].set_condition(CellCondition.none);
        }
    }

    //set stone
    cells[3][3].put_stone(Stone.white);
    cells[3][4].put_stone(Stone.black);
    cells[4][3].put_stone(Stone.black);
    cells[4][4].put_stone(Stone.white);

    //init info
    Info.end = false;
    Info.result = Result.draw;
    Info.click_pos = {x:0, y:0};
    Info.point = {my:0, enemy:0};
    Info.color = {my:0, enemy:0};
    time = 0;
    clicknum = 0;

    //decide own color
    Info.color.my = Stone.black;
    Info.color.enemy = -1*Info.color.my;

    //decide preceding
    if(Info.color.my == Stone.black)    turn = Info.color.my;
    else    turn = Info.color.enemy;

    //init display info
    count_point();
    update_conditions(cells);
    update_display_result();
    resize_process();

    //prohibit scroll
    document.addEventListener('touchmove', disable_scroll, {passive: false});
    document.addEventListener('mousewheel', disable_scroll, {passive: false});

    //set timer
    timer = setInterval(count_time,1000);
}

//count time
function count_time(){
    //console.log(time);
    time++;
}

function exist_canput_all(){
    for(i=0; i<cellnum; i++){
        for(j=0; j<cellnum; j++){
            if(cells[i][j].condition == CellCondition.canput)    return true;
        }
    }
    return false;
}

//judge end or not
function judge_flag(){
    //not exist can-put-place
    if(!exist_canput_all()){
        if(Info.point.my + Info.point.enemy == cellnum*cellnum){
            Info.end = true;
            if(Info.point.my > Info.point.enemy){
                Info.result = Result.win;
            }
            else if(Info.point.my < Info.point.enemy){
                Info.result = Result.lose;
            }
            else{
                Info.result = Result.draw;
            }
        }
        //pass
        else if(!Info.end){
            Info.end = false;
            var text = "pass: There is no place to put it.";
            if(turn == Info.color.my)   text += "(my)";
            else                        text += "(enemy)";
            console.log(text);
            turn *= -1;
            update_conditions(cells);

            //enemy or I cannot put
            if(!exist_canput_all()){
                Info.end = true;
                if(Info.point.my > Info.point.enemy){
                    Info.result = Result.win;
                }
                else if(Info.point.my < Info.point.enemy){
                    Info.result = Result.lose;
                }
                else{
                    Info.result = Result.draw;
                }
            }
        }
    }
}

//8 direct search
function judge_can_click(posX,posY){
    var _x, _y, numDifCol; //(_x,_y) is copy (posX,posY)(specified coordinates),  numDifCol: count touching different color

    for(i=-1; i<2; i++){
        for(j=-1;j<2;j++){
            _x = posX;
            _y = posY;
            numDifCol = 0;
            if(!(i==0&&j==0)){
                while(1){
                    _x += i;
                    _y += j;
                    if(!(0<=_x&&_x<cellnum && 0<=_y&&_y<cellnum)){
                        break;
                    }
                    else if(cells[_x][_y].stone == turn){
                        if(numDifCol>0){
                            numDifCol = 0;
                            return true;
                        }
                        break;
                    }
                    else if(cells[_x][_y].stone == -1*turn){
                        numDifCol++;
                    }
                    else{
                        break;
                    }
                }
            }
        }
    }
    return false;
}

//turn over stone
//dirX,dirY is direction(example: upper right -> {dirX: 1, dirY: -1} (consider screen coordinate system))
function turn_stone(posX, posY, dirX, dirY){
    if(!(0<=posX+dirX&&posX+dirX<cellnum && 0<=posY+dirY&&posY+dirY<cellnum))  return;
    if(cells[posX+dirX][posY+dirY].stone == -1*turn)  turn_stone(posX+dirX, posY+dirY, dirX, dirY);
    if(cells[posX+dirX][posY+dirY].stone == turn)  cells[posX][posY].put_stone(turn);
}

//count point
function count_point(){
    Info.point = {my:0, enemy:0};

    for(i=0;i<cellnum;i++){
        for (j=0;j<cellnum;j++){
            if(cells[i][j].stone == Info.color.my){
                Info.point.my++;
            }
            else if(cells[i][j].stone == Info.color.enemy){
                Info.point.enemy++;
            }
        }
    }
}

//update point_display
function update_display_result() {
    var text;

    if(!Info.end){
        if(Info.point.my > Info.point.enemy) text = "勝ってる！";
        else if(Info.point.my < Info.point.enemy) text = "負けてる！！！";
        else if(Info.point.my == Info.point.enemy) text = "引き分けてる！";
    }
    else{
        if(Info.result == Result.win) text = "勝ち";
        else if(Info.result == Result.lose) text = "負け";
        else text = "引き分け";
    }

    document.getElementById('point_display').innerHTML 
        = "自分: "+Info.point.my + "　対　相手: "+Info.point.enemy + "<br><br>"
        + text + "<br><br>"
        + "タイム：" + time + "秒" + "　(" + clicknum + "手目)";
}

//update cell's condition
//argument is subject of updating condition
function update_conditions(subject){
    for(var i=0;i<cellnum;i++){
        for(var j=0;j<cellnum;j++){
            //board condition init
            subject[i][j].set_condition(CellCondition.none);

            //condition (canput)
            if(judge_can_click(i,j)&&subject[i][j].stone == Stone.none){
                subject[i][j].set_condition(CellCondition.canput);
            }

            //condition (put)
            if(Info.click_pos.x>0 || Info.click_pos.y>0){
                subject[Info.click_pos.x][Info.click_pos.y].set_condition(CellCondition.put);
            }
        }
    }
}

//update board
function update_board(){
    cellsize = canvas.width / cellnum;

    for(var i=0;i<cellnum;i++){
        for(var j=0;j<cellnum;j++){
            cells[i][j].set_size(cellsize);
            cells[i][j].disp(i * cells[i][j].size, j * cells[i][j].size + heightmargin);
        }
    }
}

//process this when window resize
var wait = '';
window.addEventListener('resize',(event) => {
    if(wait){
        clearTimeout(wait);
    }
    wait = setTimeout(resize_process,200);
});

//when window resize
function resize_process(){
    var window_width = window.innerWidth - 145; //uper right's button's size!!!!!!!
    var window_height = window.innerHeight;
    var min;

    console.log(window_width, window_height);

    if(window_height > window_width) min = window_width;
    else                             min = window_height;

    if(min > MaxWindowSize){
        min = 800;
    }

    heightmargin =  (window.innerHeight - min)/2 + 1;

    canvas.style.top = heightmargin;

    canvas.width =  min;
    canvas.height = window.innerHeight;

    update_board();

    if(Info.end){
        clearInterval(timer);
    }

}

//prohibit scroll
function disable_scroll(event){
    event.preventDefault();
}



//cpu analysis
function alpha_beta(board, depth, current_turn, alpha, beta)
{
    var canput_count = 0, x, y, current_score = NO_SCORE, evaluate, board2;

    if(depth == N)  //探索の深さまで達した
    {
        return board_position(board) + number_of_candidate(board) + firm_stone(board);
    }
    else            //探索の深さまで達していないとき
    {
        // すべての場所に対して石が置けるかどうか試していく
        for(var i = 0; i < cellnum; i++)
        {
            for(var j = 0; j < cellnum; j++)
            {
                // 石が置ける場所のとき 
                if(board[i][j].condition == CellCondition.canput)
                {    
                    //board2にboardの内容をコピー    
                    board2 = JSON.parse(JSON.stringify(board));
                    

                    //board2[i][j]に石を置く
                    for(xi=-1; xi<2; xi++){
                        for(yj=-1;yj<2;yj++){
                            turn_stone_CPU(board2, i, j, xi, yj, current_turn);
                        }
                    }
                    
                    //board2の情報を更新する
                    update_conditions_CPU(board2, current_turn);

                    //再帰呼び出し
                    if(current_score != NO_SCORE && current_turn == Info.color.enemy)
                        evaluate = alpha_beta(board2, depth+1, current_turn*-1, current_score, beta);
                    else if(current_score != NO_SCORE && current_turn == Info.color.my)
                        evaluate = alpha_beta(board2, depth+1, current_turn*-1, alpha, current_score);
                    else
                        evaluate = alpha_beta(board2, depth+1, current_turn*-1, alpha, beta);

                    //αβ法
                    if(depth != 0 && current_turn == Info.color.enemy && beta <= evaluate && beta != INF)
                        return evaluate;
                    else if(depth != 0 && current_turn == Info.color.my && alpha >= evaluate && alpha != INF)
                        return evaluate;

                    // 自分(CPU)が打つ手のときは最も良いものを選ぶ
                    if((current_score < evaluate || current_score == NO_SCORE) && current_turn == Info.color.enemy){
                        current_score = evaluate;
                        x = i;
                        y = j;
                    }

                    // 相手が打つ手のときは最も悪いものを選ぶ
                    if((current_score > evaluate  || current_score == NO_SCORE) && current_turn == Info.color.my)
                        current_score = evaluate;
                    


                    canput_count++;
                }
            }
        }
        
        //置く場所がなかったときは、その現在の盤面を再帰
        if(canput_count == 0)
        {
            return alpha_beta(board, depth+1, current_turn*-1);
        }
    }

    //ルートなら、探索結果を盤面に出力
    if(depth == 0)
    {
        for(var xi = -1; xi < 2; xi++){
            for(var yj = -1; yj < 2; yj++){
                Info.click_pos.x = x;
                Info.click_pos.y = y;
                turn_stone(x, y, xi, yj);
            }
        }
    }
    
    return current_score;
}

//置ける場所を探索
function update_conditions_CPU(boardx, current_turn)
{
    //すべての盤面に対して試していく
    for(var m = 0; m < cellnum; m++)
    {
        for(var l = 0; l < cellnum; l++)
        {
            if(search_canput(boardx, m, l, current_turn) && boardx[m][l].stone == Stone.none)
            {
                boardx[m][l].condition = CellCondition.canput;
            }
            else
                boardx[m][l].condition = CellCondition.none;
        }
    }
}


function search_canput(boardx, posX, posY, current_turn)
{
    var X = posX, Y = posY;
    for(var dirX = -1; dirX < 2; dirX++)
    {
        for(var dirY = -1; dirY < 2; dirY++)
        {
            posX = X+dirX, posY = Y+dirY;
            if( !(posX<0 || posX>=cellnum || posY<0 || posY>=cellnum) )
            {
                if(boardx[posX][posY].stone == current_turn)
                {
                    while(1)
                    {
                        if(dirX == 0 && dirY == 0) break;
                        else if(posX<0 || posX>=cellnum || posY<0 || posY>=cellnum) break;
                        else if(boardx[posX][posY].stone == -1*current_turn) return true;
                        
                        posX += dirX, posY += dirY;
                    }
                }
            }
        }
    }
    return false;
}


//石を裏返す
function turn_stone_CPU(boardx, posX, posY, dirX, dirY, current_turn)
{
    if(!(0<=posX+dirX&&posX+dirX<cellnum && 0<=posY+dirY&&posY+dirY<cellnum))  return;
    if(boardx[posX+dirX][posY+dirY].stone == -1*current_turn)  turn_stone_CPU(boardx, posX+dirX, posY+dirY, dirX, dirY, current_turn);
    if(boardx[posX+dirX][posY+dirY].stone == current_turn)  boardx[posX][posY].stone = current_turn;
}

function board_position(boardx)
{
    var bp = 0;
    for(var m = 0; m < cellnum; m++)
    {
        for(var n = 0; n < cellnum; n++)
        {
            if(boardx[m][n].stone == Info.color.enemy) bp += Board_Position[m][n];
            else bp -= Board_Position[m][n];
        }
    }

    return bp*Math.random()*3;
}

function firm_stone(boardx)
{
    var fs = 0;
    //board[0][0];
    if(boardx[0][0].stone != Stone.none){
        if(boardx[0][0].stone == Info.color.enemy) fs++;
        else fs--;
    }
    //board[0][7];
    if(boardx[0][7].stone != Stone.none){
        if(boardx[0][7].stone == Info.color.enemy) fs++;
        else fs--;
    }
    //board[7][0];
    if(boardx[7][0].stone != Stone.none){
        if(boardx[7][0].stone == Info.color.enemy) fs++;
        else fs--;
    }
    //board[7][7];
    if(boardx[7][7].stone != Stone.none){
        if(boardx[7][7].stone == Info.color.enemy) fs++;
        else fs--;
    }
    return (fs + Math.random()*3) * 11;
}

function number_of_candidate(boardx)
{
    var cn = 0;
    for(var m = 0; m < cellnum; m++)
    {
        for(var n = 0; n < cellnum; n++)
        {
            if(boardx[m][n].condition == CellCondition.canput)
                cn++;
        }
    }

    return (cn + Math.random()*2) * 10;
}
