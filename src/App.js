/*global browser*/
import React, {Component} from 'react';
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

const Favicon = url => {
    try {
        return <img src={`http://${new URL(url).hostname}/favicon.ico`} alt=' ' width='16pt' height='16pt' />;
    } catch {
        return '';
    }
};


const historyRow = props =>
    <ul>
        <li>{Favicon(props.url)}<a href={props.url} className='historyLink'>{props.title || props.url}</a></li>
        {props.children ? props.children.map(child => historyRow(child)) : ''}
    </ul>;


class HistoryTable extends Component {
    constructor(props) {
        super(props);
        this.state = {historyTree: []};
    }

    componentDidMount() {
        loadHistory().then(d => {
            this.setState({historyTree: constructTree2(d.allVisits, d.links)});

            drawHistory(d.allVisits, d.links);
        });
    }

    render(){
        return <div id='historyTable'>
            {this.state.historyTree.map( historyItem => historyRow(historyItem))}
        </div>
    }
}


function drawHistory (allVisits, links) {
    const graph = convertNetwork(allVisits, links);
    drawGraph(graph, "#network");
}

export default App;
