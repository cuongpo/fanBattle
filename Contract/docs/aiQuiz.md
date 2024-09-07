# Solidity API

## Course

### Contract
Course : contracts/aiQuiz.sol

 --- 
### Modifiers:
### onlyOwner

```solidity
modifier onlyOwner()
```

### courseActive

```solidity
modifier courseActive()
```

### courseEnded

```solidity
modifier courseEnded()
```

 --- 
### Functions:
### constructor

```solidity
constructor(string _name, uint256 _startDate, uint256 _finishDate, string _imageIPFS, string _description) public payable
```

### addQuiz

```solidity
function addQuiz(string _question, string[4] _answers, uint8 _correctAnswer) public
```

### answerQuiz

```solidity
function answerQuiz(uint8[] _answers) public
```

### claimReward

```solidity
function claimReward() public
```

### withdraw

```solidity
function withdraw() public
```

### getCourse

```solidity
function getCourse() public view returns (string, address, uint256, uint256, string, string, uint256)
```

### getQuizByIndex

```solidity
function getQuizByIndex(uint256 index) public view returns (string, string[4], uint8)
```

### getQuizzes

```solidity
function getQuizzes() public view returns (struct Course.Quiz[])
```

