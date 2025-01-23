import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { User } from '../../models/user';

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
  decoded=jwtDecode(localStorage.getItem("token"));
  usuario:User
  Avatar:number=this.decoded.exp;



  ngOnInit(): void {
    this.connected$ = this.webSocketService.connected.subscribe(() => this.isConnected = true);
    this.messageReceived$ = this.webSocketService.messageReceived.subscribe(message => this.serverResponse = message);
    this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);
    
  }

  prueba(){
    console.log(this.decoded);
  }

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
}
