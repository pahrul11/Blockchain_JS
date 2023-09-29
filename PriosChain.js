const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const EC = require("elliptic").ec, ec = new EC("secp256k1");
const MINT_KEY_PAIR = ec.genKeyPair();
const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex");
const holderKeyPair = ec.genKeyPair();

//const keyPair = ec.genKeyPair();
//public key: keyPair.getPublic("hex");
//private key: keyPair.getPrivate("hex");

class Block{
    constructor(timestamp = "", data = []){
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.getHash();
        this.prevHash = "";
        this.nonce = 0;
    }

    getHash() {
        return SHA256(JSON.stringify(this.data) + this.timestamp + this.prevHash + this.nonce);
    }

    mine(difficulty){
        while(!this.hash.startsWith(Array(difficulty + 1).join("0"))){
            this.nonce++;
            this.hash = this.getHash();
        }
    }

    hasValidTransaction(chain){
        let gas = 0, reward = 0;
        this.data.forEach(transaction => {
            if(transaction.from !== MINT_PUBLIC_ADDRESS){
                gas += transaction.gas;
            }else{
                reward = transaction.amount
            }
        })
        {
            reward - gas === chain.reward &&
            this.data.every(transaction => transaction.isValid(transaction, chain))&&
            this.filter(transaction => transaction.from === MINT_PUBLIC_ADDRESS). length === 1
        };
    }
}

class Blockchain{
    constructor(){
        const initialCoinRelease = new Transaction(MINT_PUBLIC_ADDRESS, holderKeyPair.getPublic("hex"), 100000)

        this.chain = [new Block(Date.now().toString, [initialCoinRelease])];
        this.difficulty = 1;
        this.blockTime = 30000;
        this.transactions = [];
        this.reward = 6012;
    }

    getLastBlock(){
        return this.chain[this.chain.length - 1];
    }

    getBalance(address){
        let balance = 0;
        this.chain.forEach(block => {
            block.data.forEach(transaction =>{
                if(transaction.from === address){
                    balance -= transaction.amount;
                    balance -= transaction.gas;
                }
                if(transaction.to == address){
                    balance += transaction.amount;
                }
            })
        })
        return balance;
    }

    addBlock(block){
        block.prevHash = this.getLastBlock().hash;
        block.hash = block.getHash();

        block.mine(this.difficulty);

        this.difficulty += Date.now() - parseInt(this.getLastBlock().timestamp) < this.blockTime ? 1 : -1;

        this.chain.push(block);
    }

    addTransaction(transaction){
       if(transaction.isValid(transaction, this)){
            this.transactions.push(transaction);
       }
    }

    mineTransaction(rewardAddress){
        let gas = 0;
        
        this.transactions.forEach(transaction => {
            gas += transaction.gas;
        })

        const rewardTransaction = new Transaction(MINT_PUBLIC_ADDRESS, rewardAddress, this.reward + gas );
        rewardTransaction.sign(MINT_KEY_PAIR);


        if (this.transactions.length !== 0)this.addBlock(new Block(Date.now.toString(), [rewardTransaction, ...this.transactions]));
        this.transactions = [];
    }
    
    isValid(blockchain = this){
        for (let i = 1; i < blockchain.chain.length; i++){
            const currentBlock = blockchain.chain[i];
            const prevBlock = blockchain.chain[i-1];
            
            if (currentBlock.hash !== currentBlock.getHash() ||
                currentBlock.prevHash !== prevBlock.hash ||
                currentBlock.hasValidTransaction(blockchain)  
                ){
                return false;
            }
        }

        return true;
    }
}

class Transaction{
    constructor(from, to, amount, gas = 0){
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.gas = gas;
    }
    sign(keyPair){
        if (keyPair.getPublic("hex") === this.from ){
            this.signature = keyPair.sign(SHA256(this.from + this.to + this.amount + this.gas),"base64").toDER("hex") ;
        }
    }
    isValid(tx, chain){
        return(
            tx.from &&
            tx.to &&
            tx.amount &&
            (chain.getBalance(tx.from) >= tx.amount + tx.gas || tx.from === MINT_PUBLIC_ADDRESS && tx.amount === this.reward)&&
            ec.keyFromPublic(tx.from, "hex").verify(SHA256(tx.from + tx.to + tx.amount + tx.gas), tx.signature)
        )
    }
}

const PriosChain = new Blockchain();

const walletPrios = ec.genKeyPair();

const transaction = new Transaction(holderKeyPair.getPublic("hex"), walletPrios.getPublic("hex"), 2500, 10 );

transaction.sign(holderKeyPair);

PriosChain.addTransaction(transaction);
PriosChain.mineTransaction(walletPrios.getPublic("hex"));

console.log("Your Balance: ", PriosChain.getBalance(holderKeyPair.getPublic("hex")) );
console.log("Balance Token: ", PriosChain.getBalance(walletPrios.getPublic("hex")) );