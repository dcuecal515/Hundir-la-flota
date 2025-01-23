import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { User } from '../../models/user';
import { Friend } from '../../models/Friend';
import { environment } from '../../../environments/environment.development';


@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  constructor(private apiService:ApiService,private router:Router,private webSocketService:WebsocketService){
    this.connectRxjs()
  }

   
  connectRxjs() {
    this.type = 'rxjs';
    this.webSocketService.connectRxjs();
  }

  type:'rxjs'
  serverResponse: string = '';
  isConnected: boolean = false;
  connected$: Subscription;
  messageReceived$: Subscription;
  disconnected$: Subscription;
  /*decoded:User=jwtDecode(localStorage.getItem("token"));
  urlimageuser:string=environment.images+this.decoded.Avatar*/



  ngOnInit(): void {
    this.connected$ = this.webSocketService.connected.subscribe(() => this.isConnected = true);
    this.messageReceived$ = this.webSocketService.messageReceived.subscribe(message => this.serverResponse = message);
    this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);
  }



  searchQuery:string = ""


  hola:Friend={nickname: "hOla"}
  adios:Friend={nickname:"adiós"}

  friendList = [this.hola, this.adios]
  deleteToken(){
    this.apiService.deleteToken();
    this.webSocketService.disconnectRxjs();
    this.router.navigateByUrl("login");
  }
  ngOnDestroy(): void {
    this.connected$.unsubscribe();
    this.messageReceived$.unsubscribe();
    this.disconnected$.unsubscribe();
  }
  search(){
    const input = document.getElementById("search") as HTMLInputElement
    this.searchQuery = input.value
  }

  compare(nickname:string){
    if(this.searchQuery != ""){
      var newNick = nickname.toUpperCase()
      var upperQuery = this.searchQuery.toUpperCase()
      newNick = this.deleteAccents(newNick)
      upperQuery = this.deleteAccents(upperQuery)
      if(newNick.includes(upperQuery)){
        return true
      }
      else{
        return false
      }
    }
    else{
      return true
    }
  }

  deleteAccents(text:string){
    return text.replace("Á","A")
                .replace("É","E")
                .replace("Í","I")
                .replace("Ó","O")
                .replace("Ú","U")
  }
}