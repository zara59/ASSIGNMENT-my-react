import { useEffect, useState } from "react";

function App() {
  const [account, setAccount]= useState("");
  const [chainId, setChainId] = useState("0");
  const [balance, setBalance] = useState("0");



  async function setup() {


    const accounts = await window.ethereum.request (({

      method :"eth_requestAccounts"

      
    }));

    const chainId = await window.ethereum.request({
      method : "eth_chainId"
    });

    setChainId(parseInt(chainId, 16));



    console.log(accounts);
    console.log (`hexadecimal string : $[chainId]`);
    console.log ("ETH Balance:", balance);

    console.log(accounts);


    

    
    window.ethereum.on("connect",() =>{
      console.log ("connected");
    });

    window.ethereum.on("accountsChanged",(accounts)=>{
      setAccount(accounts[0]);
      console.log("account changed:", accounts);
    });

    window.ethereum.on("chainChanged",(chainId)=>{
      setChainId(parseInt(chainId, 16));
      console.log("account changed:", accounts);
    }); 



  }
  setup();
  
 useEffect(() =>{
  setup();

 },[]);


  return (
    <div>
      <EIP6963 />


       <p>Chain Id: {chainId} </p>
       <p>Connected Address {account}</p>
    </div>
  );


}

export default App;
