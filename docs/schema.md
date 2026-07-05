Trading Journal Database Schema
Overview
This project is a personal full-stack learning project built with:
* Frontend: React
* Backend: ASP.NET Core Web API (.NET C#)
* Database: PostgreSQL
  The application allows users to record trades, review their performance, analyze strategies, and maintain a trading journal.

Entity Relationship
User
│
├── Trades
│      ├── Strategy
│      ├── TradeJournal
│      ├── TradeImages
│      └── TradeTags
│
├── Strategies
├── DailyJournals
├── Watchlists
└── Tags

Tables
Users
Stores application users.
Column	Type	Description
Id	UUID	Primary Key
Username	varchar	Unique username
Email	varchar	Unique email
PasswordHash	varchar	Hashed password
CreatedAt	timestamp	Created date
UpdatedAt	timestamp	Last updated
Trades
Stores executed trades.
Column	Type	Description
Id	UUID	Primary Key
UserId	UUID	FK → Users
StrategyId	UUID (Nullable)	FK → Strategies
Ticker	varchar	Trading symbol
Market	varchar	Stocks, Forex, Crypto, Futures
Direction	enum	Long / Short
Status	enum	Open / Closed / Cancelled
EntryPrice	decimal	Entry price
ExitPrice	decimal (Nullable)	Exit price
Quantity	decimal	Position size
StopLoss	decimal (Nullable)	Stop loss
TakeProfit	decimal (Nullable)	Take profit
OpenTime	timestamp	Entry time
CloseTime	timestamp (Nullable)	Exit time
Commission	decimal	Trading fee
SwapFee	decimal	Overnight fee
CreatedAt	timestamp	Created date
UpdatedAt	timestamp	Updated date
Notes
The following values should not be stored because they can be calculated:
* Profit / Loss (PnL)
* Risk Reward Ratio
* Win Rate
* Holding Time

TradeJournals
Stores post-trade reflections and psychological notes.
Column	Type	Description
Id	UUID	Primary Key
TradeId	UUID	FK → Trades
Emotion	varchar	Emotional state
Mistakes	text	Mistakes made
LessonsLearned	text	Lessons learned
Notes	text	Additional notes
Why separate this table?
Separating journal entries from trade data allows:
* Trades to exist without a completed review.
* Cleaner database design.
* Easier future expansion (ratings, AI analysis, etc.).

Strategies
User-defined trading strategies.
Column	Type	Description
Id	UUID	Primary Key
UserId	UUID	FK → Users
Name	varchar	Strategy name
Description	text	Strategy description
Color	varchar	UI display color
Example strategies:
* Breakout
* Pullback
* Scalping
* Swing
* VWAP Bounce

TradeImages
Stores screenshots associated with trades.
Column	Type	Description
Id	UUID	Primary Key
TradeId	UUID	FK → Trades
ImagePath	varchar	File location
ImageType	enum	Before / After / Setup / Analysis
Images are stored on disk (or cloud storage), while only the file path is saved in the database.

DailyJournals
Stores daily reflections, even on days without trades.
Column	Type	Description
Id	UUID	Primary Key
UserId	UUID	FK → Users
Date	date	Journal date
Mood	varchar	Overall mood
Confidence	integer	Confidence rating (1–10)
MarketCondition	varchar	Trending, Ranging, Volatile, etc.
Notes	text	Daily notes
Tags
Custom labels created by users.
Column	Type	Description
Id	UUID	Primary Key
UserId	UUID	FK → Users
Name	varchar	Tag name
Example:
* FOMO
* Revenge Trade
* High Volume
* News Event
* London Session

TradeTags
Many-to-many relationship between Trades and Tags.
Column	Type	Description
TradeId	UUID	FK → Trades
TagId	UUID	FK → Tags
Composite Primary Key:
TradeId + TagId

Watchlists
Stores potential trading opportunities.
Column	Type	Description
Id	UUID	Primary Key
UserId	UUID	FK → Users
Ticker	varchar	Trading symbol
Reason	text	Why it's on the watchlist
TargetPrice	decimal	Optional target price
CreatedAt	timestamp	Created date
Relationships
Users
├── 1:N Trades
├── 1:N Strategies
├── 1:N DailyJournals
├── 1:N Watchlists
└── 1:N Tags

Strategies
└── 1:N Trades

Trades
├── 1:1 TradeJournals
├── 1:N TradeImages
└── N:M Tags (via TradeTags)

Future Enhancements
Potential features to add later without major schema changes:
* Multiple trading accounts
* Import trades from brokers (CSV)
* AI-generated trade analysis
* Performance dashboard
* Trade checklist
* Risk management rules
* Achievement/badge system
* Public trade sharing
* Notifications
* Calendar view

Design Principles
* Normalize data to reduce duplication.
* Calculate statistics instead of storing them.
* Separate trade execution data from journal reflections.
* Use UUIDs as primary keys.
* Include CreatedAt and UpdatedAt timestamps where appropriate.
* Design with future extensibility in mind.
