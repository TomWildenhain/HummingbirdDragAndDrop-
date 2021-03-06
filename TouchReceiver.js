/* TouchReceiver is a static class that handles all touch events.
 * It adds touch event handlers and keeps track of what types of objects are being touched/dragged.
 */
function TouchReceiver(){
	var TR=TouchReceiver; //shorthand
	//Toggle to determine of mouse or touchscreen events should be used.
	TR.mouse=false; //Use true when debugging on a desktop.
	TR.longTouchInterval=300; //The number of ms before a touch is considered a long touch.
	TR.blocksMoving=false; //No BlockStacks are currently moving.
	TR.targetType="none"; //Stores the type of object being interacted with.
	TR.touchDown=false; //Is a finger currently on the screen?
	TR.longTouch=false; //Has the event already been handled by a long touch event?
	TR.target=null; //The object being interacted with.
	TR.startX=0; //The x coord of the initial touch.
	TR.startY=0; //The y coord of the initial touch.
	TR.longTouchTimer=null; //Triggers long touch events.
	TR.timerRunning=false; //Indicates if the long touch timer is running.
	var handlerMove="touchmove"; //Handlers are different for touchscreens and mice.
	var handlerUp="touchend";
	var handlerDown="touchstart";
	if(TR.mouse){
		handlerMove="mousemove";
		handlerUp="mouseup";   
		handlerDown="mousedown";
	}
	TR.handlerMove=handlerMove;
	TR.handlerUp=handlerUp;
	TR.handlerDown=handlerDown;
	 //Add event handlers for handlerMove and handlerUp events to the whole document.
	TR.addListeners();
	//TR.test=true;
}
/* Adds event handlers for handlerMove and handlerUp events to the whole document.
 */
TouchReceiver.addListeners=function(){
	var TR=TouchReceiver;
	document.body.addEventListener(TR.handlerMove,TouchReceiver.handleMove,false);
	document.body.addEventListener(TR.handlerUp,TouchReceiver.handleUp,false);
	document.body.addEventListener(TR.handlerDown,TouchReceiver.handleDocumentDown,false);
}
/* Handles movement events and prevents drag gestures from scrolling document.
 * @param {event} event - passed event arguments.
 * @fix combine with TouchReceiver.touchmove.
 */
TouchReceiver.handleMove=function(event){
	event.preventDefault(); //Prevent document scrolling.
	TouchReceiver.touchmove(event); //Deal with movement.
}
/* Handles new touch events.
 * @param {event} event - passed event arguments.
 * @fix combine with TouchReceiver.touchstart.
 */
TouchReceiver.handleUp=function(event){
	event.preventDefault();
	TouchReceiver.touchend(event);
}
TouchReceiver.handleDocumentDown=function(event){
	if(TouchReceiver.touchstart(event)){
		GuiElements.overlay.close(); //Close any visible overlays.
	}
};
/* Returns the touch x coord from the event arguments
 * @param {event} event - passed event arguments.
 * @return {number} - x coord.
 */
TouchReceiver.getX=function(e){
	if(TouchReceiver.mouse){ //Depends on if a desktop or touchscreen is being used.
		return e.clientX/GuiElements.zoomFactor;
	}
	return e.touches[0].pageX/GuiElements.zoomFactor;
};
/* Returns the touch y coord from the event arguments
 * @param {event} event - passed event arguments.
 * @return {number} - y coord.
 */
TouchReceiver.getY=function(e){
	if(TouchReceiver.mouse){ //Depends on if a desktop or touchscreen is being used.
		return e.clientY/GuiElements.zoomFactor;
	}
	return e.touches[0].pageY/GuiElements.zoomFactor;
};
/* Handles new touch events.  Does not know which element was touched.
 * @param {event} e - passed event arguments.
 */
TouchReceiver.touchstart=function(e){
	var TR=TouchReceiver; //shorthand
	e.preventDefault(); //Stops 300 ms delay events
	e.stopPropagation();
	var startTouch=!TR.touchDown;
	if(startTouch){ //prevents multitouch issues.
		TR.stopLongTouchTimer();
		TR.touchDown=true;
		TR.targetType="none"; //Does not know the target of the touch.
		TR.target=null;
		TR.longTouch=false;
		TR.startX=TR.getX(e);
		TR.startY=TR.getY(e);
	}
	return startTouch;
};
/* Handles new touch events for Blocks.  Stores the target Block.
 * @param {Blocks} target - The Block that was touched.
 * @param {event} e - passed event arguments.
 * @fix rename to touchStartBlock.
 */
TouchReceiver.touchStartBlock=function(target,e){
	var TR=TouchReceiver; //shorthand
	if(TR.touchstart(e)){ //prevent multitouch issues.
		GuiElements.overlay.close(); //Close any visible overlays.
		if(target.stack.isDisplayStack){ //Determine what type of stack the Block is a member of.
			TR.targetType="displayStack";
			TR.setLongTouchTimer();
		}
		else{
			TR.targetType="block";
			TR.setLongTouchTimer();
		}
		TouchReceiver.target=target; //Store target Block.
	}
};
/* Handles new touch events for Slots.  Stores the target Slot.
 * @param {Slot} slot - The Slot that was touched.
 * @param {event} e - passed event arguments.
 */
TouchReceiver.touchStartSlot=function(slot,e){
	var TR=TouchReceiver;
	if(TR.touchstart(e)){
		if(slot.selected!=true){
			GuiElements.overlay.close(); //Close any visible overlays.
		}
		TR.targetType="slot";
		TouchReceiver.target=slot; //Store target Slot.
		TR.setLongTouchTimer();
	}
}
/* Handles new touch events for CategoryBNs.  Stores the target CategoryBN.
 * @param {Category} target - The Category of the CategoryBN that was touched.
 * @param {event} e - passed event arguments.
 */
TouchReceiver.touchStartCatBN=function(target,e){
	var TR=TouchReceiver;
	if(TR.touchstart(e)){
		GuiElements.overlay.close(); //Close any visible overlays.
		TR.targetType="category";
		target.select(); //Makes the button light up and the category become visible.
		GuiElements.overlay.close(); //Close any visible overlays.
	}
};
/* Handles new touch events for Buttons.  Stores the target Button.
 * @param {Button} target - The Button that was touched.
 * @param {event} e - passed event arguments.
 */
TouchReceiver.touchStartBN=function(target,e){
	var TR=TouchReceiver;
	if(TR.touchstart(e)){
		if(!target.isOverlayPart){
			GuiElements.overlay.close(); //Close any visible overlays.
		}
		TR.targetType="button";
		target.press(); //Changes the button's appearance and may trigger an action.
		TR.target=target;
	}
};
/* Handles new touch events for the backgund of the palette.
 * @param {event} e - passed event arguments.
 */
TouchReceiver.touchStartPalette=function(e){
	var TR=TouchReceiver;
	if(TR.touchstart(e)){
		GuiElements.overlay.close(); //Close any visible overlays.
		TR.targetType="palette";
		TR.target=null; //The type is all that is important. There is only one palette.
	}
};
/* @fix Write documentation. */
TouchReceiver.touchStartTabSpace=function(e){
	var TR=TouchReceiver;
	if(TR.touchstart(e)){
		GuiElements.overlay.close(); //Close any visible overlays.
		TR.targetType="tabSpace";
		TR.target=null;
	}
};
/* @fix Write documentation. */
TouchReceiver.touchStartDisplayBox=function(e){
	var TR=TouchReceiver;
	if(TR.touchstart(e)){
		GuiElements.overlay.close(); //Close any visible overlays.
		TR.targetType="displayBox";
		TR.target=null;
		DisplayBox.hide();
	}
};
/* @fix Write documentation. */
TouchReceiver.touchStartOverlayPart=function(e){
	var TR=TouchReceiver;
	if(TR.touchstart(e)){

	}
};
TouchReceiver.touchStartMenuBnListScrollRect=function(target,e){
	var TR=TouchReceiver;
	if(TR.touchstart(e)) {
		if(!target.isOverlayPart) {
			GuiElements.overlay.close(); //Close any visible overlays.
		}
		TR.targetType="menuBnList";
		TouchReceiver.target=target; //Store target Slot.
	}
};
/* Handles touch movement events.  Tells stacks, Blocks, Buttons, etc. how to respond.
 * @param {event} e - passed event arguments.
 */
TouchReceiver.touchmove=function(e){
	var TR=TouchReceiver;
	if(TR.touchDown&&!TR.longTouch&&(TR.startX!=TR.getX(e)||TR.startY!=TR.getY(e))){
		//If the user drags a Slot, the block they are dragging should become the target.
		if(TR.targetType=="slot"){
			TR.target=TR.target.parent; //Now the user is dragging a block.
			if(TR.target.stack.isDisplayStack){
				TR.targetType="displayStack";
			}
			else{
				TR.targetType="block";
			}
		}
		/* If the user drags a Block that is in a DisplayStack, 
		the DisplayStack copies to a new BlockStack, which can be dragged. */
		if(TR.targetType=="displayStack"){
			var x=TR.target.stack.getAbsX(); //Determine where the copied BlockStack should go.
			var y=TR.target.stack.getAbsY();
			//The first block of the duplicated BlockStack is the new target.
			TR.target=TR.target.stack.duplicate(x,y).firstBlock;
			TR.targetType="block";
		}
		/* If the user drags a Block that is a member of a BlockStack, 
		then the BlockStack should move. */
		if(TR.targetType=="block"){
			//If the CodeManager has not started the movement, this must be done first.
			if(TR.blocksMoving){
				//The CodeManager handles moving BlockStacks.
				CodeManager.move.update(TR.getX(e),TR.getY(e));
			}
			else{
				CodeManager.move.start(TR.target,TR.getX(e),TR.getY(e));
				TR.blocksMoving=true;
			}
		}
		//If the user drags the palette, it should scroll.
		if(TR.targetType=="palette"){
			if(!BlockPalette.scrolling){
				BlockPalette.startScoll(TR.getX(e),TR.getY(e));
			}
			else{
				BlockPalette.updateScroll(TR.getX(e),TR.getY(e));
			}
		}
		//If the user drags the tab space, it should scroll.
		if(TR.targetType=="tabSpace"){
			if(!TabManager.scrolling){
				TabManager.startScoll(TR.getX(e),TR.getY(e));
			}
			else{
				TabManager.updateScroll(TR.getX(e),TR.getY(e));
			}
		}
		//If the user drags a button and it has a menuBnList, it should scroll it.
		if(TR.targetType=="button"){
			if(TR.target.menuBnList!=null&&TR.target.menuBnList.scrollable){
				TR.targetType="menuBnList";
				TR.target.interrupt();
				TR.target=TR.target.menuBnList;
			}
		}
		//If the user drags a menuBnList, it should scroll.
		if(TR.targetType=="menuBnList"){
			if(!TR.target.scrolling&&TR.target.scrollable){
				TR.target.startScroll(TR.getY(e));
			}
			else{
				TR.target.updateScroll(TR.getY(e));
			}
		}
	}
};
/* Handles touch end events.  Tells stacks, Blocks, Buttons, etc. how to respond.
 * @param {event} e - passed event arguments.
 * @fix DateTime is no longer necessary to prevent repeat events.
 */
TouchReceiver.touchend=function(e){
	var TR=TouchReceiver;
	var touchWasDown=TR.touchDown;
	TR.touchDown=false;
	if(touchWasDown&&!TR.longTouch){ //Prevents multitouch problems.
		TR.touchDown=false;
		if(TR.targetType=="block"){
			if(TR.blocksMoving){ //If a stack is moving, tell the CodeManager to end the movement.
				CodeManager.move.end();
				TR.blocksMoving=false;
			}
			else{ //The stack was tapped, so it should run.
				TR.target.stack.startRun();
			}
		}
		else if(TR.targetType=="button"){
			TR.target.release(); //Pass message on to button.
		}
		else if(TR.targetType=="slot"){
			//If a Slot is pressed and released without dragging, it is time to edit its value.
			TR.target.edit();
		}
		else if(TR.targetType=="palette"){
			BlockPalette.endScroll();
		}
		else if(TR.targetType=="tabSpace"){
			TabManager.endScroll();
		}
		else if(TR.targetType=="menuBnList"){
			TR.target.endScroll();
		}
	}
};
/* Called when a user's interaction with the screen should be interrupted due to a dialog, etc.
 * Blocks that are moving should stop moving, but actions should not be triggered.
 */
TouchReceiver.touchInterrupt=function(){
	var TR=TouchReceiver;
	var touchWasDown=TR.touchDown;
	TR.touchDown=false;
	if(touchWasDown&&!TR.longTouch){ //Only interrupt if there is a finger on the screen.
		TR.touchDown=false;
		if(TR.targetType=="block"){
			if(TR.blocksMoving){ //If a stack is moving, tell the CodeManager to end the movement.
				CodeManager.move.interrupt();
				TR.blocksMoving=false;
			}
		}
		else if(TR.targetType=="button"){
			TR.target.interrupt(); //Remove the highlight without triggering the action.
		}
		else if(TR.targetType=="palette"){
			BlockPalette.endScroll();
		}
		else if(TR.targetType=="tabSpace"){
			TabManager.endScroll();
		}
	}
};
/* @fix Write documentation. */
TouchReceiver.touchLong=function(){
	var TR = TouchReceiver;
	TR.stopLongTouchTimer();
	if(TR.touchDown){
		if(TR.targetType=="slot"){
			TR.target=TR.target.parent; //Now the user is holding a block.
			if(TR.target.stack.isDisplayStack){
				TR.targetType="displayStack";
			}
			else{
				TR.targetType="block";
			}
		}
		if(TR.targetType=="displayStack"){
			if(!TR.blocksMoving&&(TR.target.blockTypeName=="B_Variable"||TR.target.blockTypeName=="B_List")){
				TR.longTouch=true;
				new BlockContextMenu(TR.target,TR.startX,TR.startY);
			}
		}
		if(TR.targetType=="block"){
			if(!TR.blocksMoving){
				TR.longTouch=true;
				new BlockContextMenu(TR.target,TR.startX,TR.startY);
			}
		}
	}
};
TouchReceiver.setLongTouchTimer=function() {
	var TR = TouchReceiver;
	TR.stopLongTouchTimer();
	TR.longTouchTimer = self.setInterval(function () {
		TouchReceiver.touchLong();
	}, TR.longTouchInterval);
	TR.timerRunning=true;
};
TouchReceiver.stopLongTouchTimer=function(){
	var TR = TouchReceiver;
	if(TR.timerRunning){
		TR.longTouchTimer = window.clearInterval(this.longTouchTimer);
		TR.timerRunning=false;
	}
};
/* Adds handlerDown listeners to the parts of a CategoryBN.
 * @param {SVG element} element - The part of the CategoryBN the listeners are being applied to.
 * @param {Category} category - The category of the CategoryBN.
 * @fix maybe rename this function.
 */
TouchReceiver.addListenersCat=function(element,category){
	var TR=TouchReceiver;
	element.category=category; //Teaches the SVG element to know what Category it belongs to.
	element.addEventListener(TR.handlerDown, function(e) {
		//When it is touched, the SVG element will tell the TouchReceiver its Category.
		TouchReceiver.touchStartCatBN(this.category,e);
	}, false);
};
/* Adds handlerDown listeners to the parts of a Block.
 * @param {SVG element} element - The part of the Block the listeners are being applied to.
 * @param {Block} parent - The Block the SVG element belongs to.
 * @fix maybe rename this function
 * @fix maybe use this.block rather than this.parent.
 */
TouchReceiver.addListenersChild=function(element,parent){
	var TR=TouchReceiver;
	element.parent=parent; //Teaches the SVG element to know what Block it belongs to.
	element.addEventListener(TR.handlerDown, function(e) {
		//When it is touched, the SVG element will tell the TouchReceiver its Block.
		TouchReceiver.touchStartBlock(this.parent,e);
	}, false);
};
/* Adds handlerDown listeners to the parts of a Slot.
 * @param {SVG element} element - The part of the Slot the listeners are being applied to.
 * @param {Slot} slot - The Slot the SVG element belongs to.
 */
TouchReceiver.addListenersSlot=function(element,slot){
	var TR=TouchReceiver;
	element.slotRef=slot; //Teaches the SVG element to know what Slot it belongs to.
	element.addEventListener(TR.handlerDown, function(e) {
		//When it is touched, the SVG element will tell the TouchReceiver its Slot.
		TouchReceiver.touchStartSlot(this.slotRef,e);
	}, false);
};
/* Adds handlerDown listeners to the parts of a Button.
 * @param {SVG element} element - The part of the Button the listeners are being applied to.
 * @param {Button} parent - The Button the SVG element belongs to.
 * @fix maybe use this.button rather than this.parent.
 */
TouchReceiver.addListenersBN=function(element,parent){
	var TR=TouchReceiver;
	element.parent=parent; //Teaches the SVG element to know what Button it belongs to.
	element.addEventListener(TR.handlerDown, function(e) {
		//When it is touched, the SVG element will tell the TouchReceiver its Button.
		TouchReceiver.touchStartBN(this.parent,e);
	}, false);
};
/* Adds handlerDown listeners to the background of the Palette. Used for scrolling.
 */
TouchReceiver.addListenersPalette=function(element){
	var TR=TouchReceiver;
	element.addEventListener(TR.handlerDown, function(e) {
		//When it is touched, the SVG element will tell the TouchReceiver.
		TouchReceiver.touchStartPalette(e);
	}, false);
};
/* Adds handlerDown listeners to the background space in the Tab where blocks go. Used for scrolling.
 */
TouchReceiver.addListenersTabSpace=function(element){
	var TR=TouchReceiver;
	element.addEventListener(TR.handlerDown, function(e) {
		//When it is touched, the SVG element will tell the TabManager.
		TouchReceiver.touchStartTabSpace(e);
	}, false);
};
/* Adds handlerDown listeners to the parts of the displayBox.
 * @param {SVG element} element - The part of the displayBox the listeners are being applied to.
 */
TouchReceiver.addListenersDisplayBox=function(element){
	var TR=TouchReceiver;
	element.addEventListener(TR.handlerDown, function(e) {
		//When it is touched, the SVG element will tell the TouchReceiver.
		TouchReceiver.touchStartDisplayBox(e);
	}, false);
};
/* Adds handlerDown listeners to the parts of any overlay that do not already have handlers.
 * @param {SVG element} element - The part the listeners are being applied to.
 */
TouchReceiver.addListenersOverlayPart=function(element){
	var TR=TouchReceiver;
	element.addEventListener(TR.handlerDown, function(e) {
		TouchReceiver.touchStartOverlayPart(e);
	}, false);
};
TouchReceiver.addListenersMenuBnListScrollRect=function(element,parent){
	var TR=TouchReceiver;
	element.parent=parent;
	element.addEventListener(TR.handlerDown, function(e) {
		TouchReceiver.touchStartMenuBnListScrollRect(this.parent,e);
	}, false);
};