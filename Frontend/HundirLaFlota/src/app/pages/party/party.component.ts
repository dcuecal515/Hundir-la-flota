import { Component } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { RequestService } from '../../services/request.service';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { User } from '../../models/user';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-party',
  standalone: true,
  imports: [],
  templateUrl: './party.component.html',
  styleUrl: './party.component.css'
})
export class PartyComponent {
  constructor(private webSocketService:WebsocketService,private requestService:RequestService,private router:Router,private dataService:DataService){
      if(localStorage.getItem("token")){
            this.decoded=jwtDecode(localStorage.getItem("token"));
          }else if(sessionStorage.getItem("token")){
            this.decoded=jwtDecode(sessionStorage.getItem("token"));
          }else{
            this.decoded=null
          }
  }
  decoded:User;
  messageReceived$: Subscription;
  disconnected$: Subscription;
  isConnected: boolean = false;


  ngOnInit(): void {
    this.messageReceived$ = this.webSocketService.messageReceived.subscribe(async message => {
      if(message.message == "Datos iniciales"){

      }
    });
    this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);
  }
  ngOnDestroy(): void {
    this.messageReceived$.unsubscribe();
    this.disconnected$.unsubscribe();
  }

}
