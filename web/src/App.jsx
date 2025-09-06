import './App.css';
import { Router, Route } from "@solidjs/router";
import Home from './views/Home';
import Roaming from './views/Roaming';
import RoomMgr from './views/RoomMgr';
import Guard from './views/Guard';
import Lock from './views/Lock';

function App() {
  return ( 
    <Router>
      <Route path="/" component={Home} />
      <Route path="/lock" component={Lock} />
      <Route path="/chat/*" component={Guard} />
      <Route path="/roam" component={Roaming} />
      <Route path="/room/:id?" component={RoomMgr} />
    </Router>
  );
}
export default App;
