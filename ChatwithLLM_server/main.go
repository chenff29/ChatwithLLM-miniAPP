package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

type User struct {
	ID   string
	Conn *websocket.Conn
}

var clients = make(map[string]*User)
var mu sync.Mutex

type ClinetRequest struct {
	UserID   string    `json:"userid"`
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Chat2Ollama struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Response2Client struct {
	Code    int    `json:"code"`
	UserID  string `json:"userid"`
	Message string `json:"message"`
}

func wsHandler(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	// 生成唯一用户ID
	userID := generateUniqueUserID()
	fmt.Println("生成用户ID", userID)

	// 将用户添加到用户列表
	mu.Lock()
	clients[userID] = &User{ID: userID, Conn: conn}
	mu.Unlock()

	// 向客户端发送用户ID
	response := Response2Client{
		Code:    201,
		UserID:  userID,
		Message: "Welcome! Your user ID is: " + userID,
	}
	responseJSON, _ := json.Marshal(response)
	err = sendMessage(conn, responseJSON)
	if err != nil {
		fmt.Println("Error sending user ID:", err)
		return
	}

	// 从用户列表删除用户
	defer func() {
		mu.Lock()
		delete(clients, userID)
		mu.Unlock()
	}()

	for {
		// 使用 BindJSON 方法将请求体解析为 ChatRequest 结构体
		_, message, err := conn.ReadMessage()
		if err != nil {
			fmt.Println(err)
			break
		}

		var clientReq ClinetRequest
		if err := json.Unmarshal(message, &clientReq); err != nil {
			fmt.Printf("failed to parse JSON message: %v", err)
			continue
		}
		fmt.Println("从前端接受请求：", clientReq.UserID, clientReq.Model, clientReq.Messages)
		fmt.Printf("JSON:\n%+v\n", clientReq)

		message2Ollama := Chat2Ollama{
			Model:    clientReq.Model,
			Messages: clientReq.Messages,
		}
		message2OllamaJson, _ := json.Marshal(message2Ollama)

		resp, err := http.Post("http://localhost:8000/api/chat", "application/json", io.NopCloser(bytes.NewBuffer(message2OllamaJson)))
		// resp, err := http.Post("http://localhost:8000/api/chat", "application/json", io.NopCloser(message))
		if err != nil {
			fmt.Println("Error sending request:", err)
			return
		}
		defer resp.Body.Close()

		reader := bufio.NewReader(resp.Body)
		for {
			line, err := reader.ReadString('\n')
			if err != nil && err != io.EOF {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			if line != "" {
				// fmt.Println(line)
				var message map[string]interface{}
				if err := json.Unmarshal([]byte(line), &message); err == nil {
					done, ok := message["done"].(bool)
					if ok && !done {
						fmt.Println(time.Now(), message)
						broadcastMessage(clientReq.UserID, line)
					} else {
						fmt.Println(time.Now(), message)
						broadcastMessage(clientReq.UserID, line)
					}
				} else {
					fmt.Printf("解析 JSON 失败: %v\n", err)
				}
			}
			if err == io.EOF {
				break
			}
		}
	}
}

// 生成唯一用户ID的简单方法
func generateUniqueUserID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func sendMessage(conn *websocket.Conn, message []byte) error {
	return conn.WriteMessage(websocket.TextMessage, message)
}

// func broadcastMessage(message map[string]interface{}) {
// 	for client := range clients {
// 		client.WriteJSON(message)
// 	}
// }

// 广播消息给指定用户
func broadcastMessage(userID, message string) {
	mu.Lock()
	user, exists := clients[userID]
	mu.Unlock()
	if exists {
		response := Response2Client{
			Code:    202,
			UserID:  userID,
			Message: message,
		}
		responseJSON, _ := json.Marshal(response)
		err := sendMessage(user.Conn, responseJSON)
		if err != nil {
			fmt.Println("Error sending message:", err)
		}
	}
}

func main() {
	r := gin.Default()

	r.GET("/ws", wsHandler)
	r.GET("/ws_1", WsHandler1)

	r.Run(":8080")
	// go func() {
	// 	err := r.Run(":5000")
	// 	if err != nil {
	// 		log.Fatal(err)
	// 	}
	// }()
	// select {}
}
