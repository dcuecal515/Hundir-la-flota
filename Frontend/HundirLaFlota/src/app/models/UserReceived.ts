import { Game } from "./Game"

export interface UserReceived{
    nickName:string
    email:string
    avatar:string
    gamesPlayed:Game[]
}