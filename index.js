const bodyParser = require('body-parser') //post body 추출 모듈
const express = require('express')        //express 프레임워크
const session = require('express-session')//session
const app = express()

app.set('views', './views') //view 지정
app.set('view engine', 'pug') //pug 사용

app.use(express.static('public')) //express의 정적 파일 제공 public 폴더에서
app.use(bodyParser.urlencoded({extended: false})) //post body 추출
app.use(session({
  secret: "node-session",
  resave: false,
  saveUninitialized: true
}))

//mysql
const mysql  = require('mysql')
const pool   = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  port     : '3366',
  user     : 'root',
  password : '1234',
  database : 'nodejssql'
})

//출처: https://electronic-moongchi.tistory.com/83
Date.prototype.format = function (f) {
    if (!this.valueOf()) return " ";

    var weekKorName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var weekKorShortName = ["일", "월", "화", "수", "목", "금", "토"];
    var weekEngName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var weekEngShortName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var d = this;

    return f.replace(/(yyyy|yy|MM|dd|KS|KL|ES|EL|HH|hh|mm|ss|a\/p)/gi, function ($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear(); // 년 (4자리)
            case "yy": return (d.getFullYear() % 1000).zf(2); // 년 (2자리)
            case "MM": return (d.getMonth() + 1).zf(2); // 월 (2자리)
            case "dd": return d.getDate().zf(2); // 일 (2자리)
            case "KS": return weekKorShortName[d.getDay()]; // 요일 (짧은 한글)
            case "KL": return whilekKorName[d.getDay()]; // 요일 (긴 한글)
            case "ES": return weekEngShortName[d.getDay()]; // 요일 (짧은 영어)
            case "EL": return weekEngName[d.getDay()]; // 요일 (긴 영어)
            case "HH": return d.getHours().zf(2); // 시간 (24시간 기준, 2자리)
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2); // 시간 (12시간 기준, 2자리)
            case "mm": return d.getMinutes().zf(2); // 분 (2자리)
            case "ss": return d.getSeconds().zf(2); // 초 (2자리)
            case "a/p": return d.getHours() < 12 ? "오전" : "오후"; // 오전/오후 구분
            default: return $1;
        }
    });
};
String.prototype.string = function (len) { var s = '', i = 0; while (i++ < len) { s += this; } return s; };
String.prototype.zf = function (len) { return "0".string(len - this.length) + this; };
Number.prototype.zf = function (len) { return this.toString().zf(len); };

//글삭제
app.get('/deletetopic/:id', (req,res) => {
  var id = req.params.id
  pool.query(`
    DELETE FROM topic
    WHERE topic.id = '${id}'`,
    (error, results, field) => {
      if(error) {
        console.error(error.stack)
      } else {
        res.redirect('/..')
      }
    }
  )
})

//글수정 화면
app.get('/modifytopic/:id', (req,res)=>{
  id = req.params.id
  pool.query(`SELECT title, content from topic where id=${id}`,
    (error, results, fields) =>{
      name = req.session.user
      title = results[0]['title']
      content = results[0]['content']
      res.render('modifytopic', {id:id, name:name, title:title, content:content})
    })
})

//글수정
app.post('/modifytopic/:id', (req,res) => {
  id = req.body.id
  title = req.body.title
  content = req.body.content
  pool.query(`UPDATE topic
              SET title = '${title}',
              content = '${content}'
              WHERE id = ${id}`,
    (error, results, fields) => {
      console.log(results)
      res.redirect('/../..')
    }
  )
})

//본문
app.get('/topic/:id', (req,res)=>{
  var id = req.params.id
  pool.query(`
    SELECT topic.id, title, content, author.name as author,
          DATE_FORMAT(date, '%Y-%m-%d %T') AS date_formatted
    FROM topic
    JOIN author
    ON topic.author_name = author.name
    WHERE topic.id = '${id}'`,
    (error, results, fields) => {
      if(error) {
        console.error(error.stack)
      } else {
        console.log(results)
        var loggedin = false
        if(req.session.user == results[0]['author'])
          loggedin = true
        res.render('topic', {topic:results, loggedin:loggedin})
      }
    }
  )
})

//로그인 화면
app.get('/login', (req,res) => {
  loginfailed = false
  if (req.session.login == 'failure') {
    loginfailed = true
  }
  req.session.login = undefined
  res.render('login', {loginfailed:loginfailed})
})

//로그인
app.post('/login', (req,res) => {
  name = req.body.name
  password = req.body.password
  pool.query(`SELECT * from author where name = '${name}'
              and password = '${password}'`,
    (error, results, fields) => {
      if(error) {
        console.error(error.stack)
      } else {
        if(results.length != 0) {
          req.session.login = 'success'
          req.session.user = results[0]['name']
          res.redirect('/')
        } else {
          req.session.login = 'failure'
          res.redirect('/login')
        }
      }
    }
  )
})

//로그아웃
app.get('/logout', (req,res) => {
  req.session.user = undefined
  res.redirect('/..')
})

//글쓰기 화면
app.get('/newtopic', (req,res)=>{
  res.render('newtopic', {name:req.session.user})
})

//글쓰기
app.post('/newtopic', (req,res)=>{
  name = req.body.name
  title = req.body.title
  content = req.body.content
  pool.query(`
    INSERT INTO topic
    VALUES (null,
            '${title}',
            '${content}',
            '${new Date().format("yyyy-MM-dd HH:mm:ss")}',
            '${name}')`,
    (error, results, fields) =>{
      if(error) {
        console.error(error.stack)
      } else {
        res.redirect('/..')
      }
    }
  )
})

//메인화면(글목록, 메뉴)
app.get('/', (req,res)=>{
  pool.query(`
    SELECT   @rownum := @rownum-1 as rownum,
             topic.id, title, author.name as author,
             DATE_FORMAT(date, '%Y-%m-%d') AS date_formatted
    FROM     (select @rownum := (select count(*) from topic)) tmp, topic
    JOIN     author
    ON       topic.author_name = author.name
    ORDER BY topic.id desc`,
    function (error, results, fields) {
      if (error) {
        console.error(error.stack)
      } else {
        console.log(results);

        var user = 'Guest'
        if(req.session.user) {
          user = req.session.user
        }
        var loggedin = user != 'Guest'
        res.render('main', {
          topic:results,
          user:user,
          loggedin:loggedin}
        )
      }
    }
  )
})

//서버 시작
app.listen(3000, function() {
  console.log('connected 3000 port')
})
