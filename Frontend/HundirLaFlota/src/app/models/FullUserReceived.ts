import { Game } from "./Game"

export interface FullUserReceived{
    id:number
    nickName:string
    email:string
    avatar:string
    games:Game[]
}