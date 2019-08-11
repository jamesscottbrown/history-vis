/*global browser*/
import React, {Component} from 'react';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import logo from './logo.svg';
import './App.css';
import {loadHistory, constructTree, constructTree2, convertNetwork} from './loadHistory.js'
import {drawGraph} from './network'

function App() {

  return (
    <div className="App">
      <header className="App-header">
        <h1>History Tree</h1>
      </header>
          <HistoryTable></HistoryTable>
    </div>
  );
//});

}

const Filter = props =>
    <div>
        <label for='filterBox'>Filter URLs</label>
        <input id='filterBox' onChange={props.onchange} defaultValue={props.filter}></input>
    </div>;

const DateRange = props => <div>
    <DatePicker
    selected={props.startDate}
    onChange={ props.changeStartDate }
    showTimeSelect
    timeFormat="HH:mm"
    timeIntervals={15}
    dateFormat="MMMM d, yyyy h:mm aa"
    timeCaption="time"
/>

    <DatePicker
        selected={props.endDate}
        onChange={ props.changeEndDate }
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="MMMM d, yyyy h:mm aa"
        timeCaption="time"
    />

    <button onChange={props.updateHistorySearch}>Update</button>
</div>;

    const Favicon = url => {
    try {
        return <img src={`http://${new URL(url).hostname}/favicon.ico`} alt=' ' width='16pt' height='16pt' />;
    } catch {
        return '';
    }
};


const historyRow = (props, filter) => {
    const matchingRow = filter && (props.title.toLowerCase().includes(filter.toLowerCase()) || props.url.toLowerCase().includes(filter.toLowerCase()));
    const rowClass = matchingRow ? 'matching-row' : 'nonmatching-row';

    return <ul>
        <li className={rowClass}>{Favicon(props.url)}<a href={props.url} className='historyLink'>{props.title || props.url}</a></li>
        {props.children ? props.children.map(child => historyRow(child, filter)) : ''}
    </ul>;
};


class HistoryTable extends Component {
    constructor(props) {
        super(props);
        this.state = {historyTree: [], filter: '', startDate: new Date(Date.now() - 1000*60*60*2), endDate: new Date()};

        this.updateFilter = this.updateFilter.bind(this);
        this.changeStartDate = this.changeStartDate.bind(this);
        this.changeEndDate = this.changeEndDate.bind(this);
        this.updateHistorySearch = this.updateHistorySearch.bind(this);

    }

    componentDidMount() {
        loadHistory(this.state.startDate, this.state.endDate).then(d => {
            this.setState({historyTree: constructTree2(d.allVisits, d.links)});
            drawHistory(d.allVisits, d.links);
        });
    }

    updateFilter(event){
        this.setState({filter: event.target.value});
    }

    changeStartDate(date){
        this.setState({startDate: date});
        this.updateHistorySearch();
    }

    changeEndDate(date){
        this.setState({endDate: date});
        this.updateHistorySearch();
    }

    updateHistorySearch(){
        console.log('About to update history!');
        loadHistory(this.state.startDate, this.state.endDate).then(d => {
            this.setState({historyTree: constructTree2(d.allVisits, d.links)});
            console.log('Updated history');
            drawHistory(d.allVisits, d.links);
        });

    }

    render() {
        return <div>
            <DateRange startDate={this.state.startDate} endDate={this.state.endDate} changeStartDate={this.changeStartDate} changeEndDate={this.changeEndDate} updateHistorySearch={this.updateHistorySearch}/>
            <Filter filter={this.state.filter} onchange={this.updateFilter} />
            <div id='historyTable'>
                {this.state.historyTree.map(historyItem => historyRow(historyItem, this.state.filter))}
            </div>
        </div>
    }
}


function drawHistory (allVisits, links) {
    const graph = convertNetwork(allVisits, links);
    drawGraph(graph, "#network");
}

export default App;
