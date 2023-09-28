const { json } = require("stream/consumers");

const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");

class Block{
    constructor(timestamp = "", data = []){
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.getHash();
        this.prevHash = "";
    }

    getHash() {
        return SHA256(JSON.stringify(this.data) + this.timestamp + this.prevHash);
    }
}

class Blockchain{
    constructor(){
        this.chain = [new Block(Date.now().toString())];
    }

    getLastBlock(){
        return this.chain[this.chain.length - 1];
    }

    addBlock(block){
        block.prevHash = this.getLastBlock().hash;
        block.hash = block.getHash;

        this.chain.push(block);
    }

    isValid(blockchain = this){
        for (let i = 0; i < blockchain.chain.length; i++){
            const currentBlock = blockchain.chain[i];
            const prevBlock = blockchain.chain[i-1];
            
            if (currentBlock.hash !== currentBlock.getHash() || currentBlock.prevHash !== prevBlock.hash){
                return false;
            }
        }

        return true;
    }
}

const PriosChain = new Blockchain();
PriosChain.addBlock(new Block(Date.now().toString(), ["Hello Welcome"]));
PriosChain.chain[1].data = [1];
console.log(PriosChain.isValid());