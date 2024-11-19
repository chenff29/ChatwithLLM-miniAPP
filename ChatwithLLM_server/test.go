package main

import (
	"log"

	"github.com/gin-gonic/gin"
)

// var upgrader = websocket.Upgrader{
// 	ReadBufferSize:  1024,
// 	WriteBufferSize: 1024,
// 	// 允许所有来源的请求，实际使用中应根据需求配置
// 	CheckOrigin: func(r *http.Request) bool {
// 		return true
// 	},
// }

func WsHandler1(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("upgrade:", err)
		return
	}
	defer conn.Close()

	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("read:", err, message)
			break
		}
		log.Printf("recv: %s", message)

		if err := conn.WriteMessage(messageType, message); err != nil {
			log.Println("write:", err)
			break
		}
	}
}

// func main() {
// 	r := gin.Default()
// 	r.GET("/ws_1", wsHandler1)
// 	fmt.Println("Server is running on :8080...")
// 	log.Fatal(r.Run(":8080"))
// }
