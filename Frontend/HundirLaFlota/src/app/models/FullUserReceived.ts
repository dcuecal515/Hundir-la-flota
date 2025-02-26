import { Game } from "./Game"

export interface FullUserReceived{
    nickName:string
    email:string
    avatar:string
    games:Game[]
}