import { Component,  Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { companies } from '../constants';
import { CompanyData } from '../service/historical_data_factory';

@Component({
  selector: 'historical-data',
  templateUrl: '../templates/historical_data.html',
  styleUrls: ['../styles/historical_data.css'],
  providers: [] //To be changed
})
export class HistoricalDataComponent implements OnInit {
    
    @Input() private company_data : CompanyData[];
    private volatilityData : VolatilityData[] = [];

    ngOnInit() : void {
      //TODO
      for (let company of this.company_data) {
        company.dailySeriesData.subscribe(
          //this.generateVolatilityData.bind(this), //Bind fixed
          this.stdVolatility.bind(this),
          err => {throw 'FetchError'},
          () => {
            console.log("PULL SUCCESS");
            this.volatilityData.sort( (a, b) => {
              //return b.range - a.range;
              return b.volatility - a.volatility;
            });
          }
        );
      }
    }

    /**@deprecated */
    private generateVolatilityData(res) : void {
      let date = new Date();
      //get yesterday
      date = new Date(date.getTime() - 86400000); //86400000 = 24 hrs * 60 min/hr * 60 sec/min * 1000 ms/s
      let dayNum = date.getDate().toString();
      let year = date.getFullYear().toString();
      let month = date.getMonth().toString();
      dayNum = parseInt(dayNum) < 10 ? "0" + dayNum : dayNum;
      month = parseInt(month) < 10  ? "0" + month : month;
      let dateString = year + "-" + month + "-" + dayNum;

      this.volatilityData.push({
        symbol: res["Meta Data"]["2. Symbol"],
        range: Math.abs(res["Time Series (Daily)"][dateString]["2. high"] - 
          res["Time Series (Daily)"][dateString]["3. low"]),
          volatility: 0 //Unused
      }); 
    }

    //Alternate calculation of volatility
    private stdVolatility(res) : void {
      //TODO
      let num = 30; //Can be changed
      let date = new Date();
      //get yesterday
      date = new Date(date.getTime() - 86400000); //86400000 = 24 hrs * 60 min/hr * 60 sec/min * 1000 ms/s
      let vals = [];
      for (let i = 0; i < num; i++) {
        let curr = new Date(date.getTime() - (i * 86400000));
        let dayNum = curr.getDate().toString();
        let year = curr.getFullYear().toString();
        let month = curr.getMonth().toString();
        dayNum = parseInt(dayNum) < 10 ? "0" + dayNum : dayNum;
        month = parseInt(month) < 10  ? "0" + month : month;
        let dateString = year + "-" + month + "-" + dayNum;
        //let data = res["Time Series (Daily)"][dateString]["4. close"];
        if (res["Time Series (Daily)"].hasOwnProperty(dateString)) 
          vals.push(res["Time Series (Daily)"][dateString]["4. close"]);
        else num++; //Ignore weekends or days with no data
      }

      let avg = this.avgArray(vals);
      this.volatilityData.push( {
        symbol: res["Meta Data"]["2. Symbol"],
        range: 0, //Unused
        volatility: (this.std(avg, vals))
      });

    }

    private avgArray (array) : number {
      let avg = 0.0;
      array.forEach(value => { avg = avg + parseFloat(value) })
      return avg / array.length;
    }

    private std(avg, vals) : number{
      let total = 0.0;
      let arr = vals.map(value => Math.pow(value - avg, 2));
      arr.forEach(value => total = total + value);
      return Math.sqrt(total / vals.length);
    }
}

interface VolatilityData {
  symbol: string;
  range: number; //Difference between high and low
  volatility: number;
}