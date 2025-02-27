import { Injectable } from '@angular/core';
import { Request } from '../models/Request';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }
  players:number=0
  playersPlaying:number=0
  games:number=0
  opponentName:string=""
}
