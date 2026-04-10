import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Pencil, Square, Circle, Type, Eraser, Download,
  Undo, Redo, Trash2, Move, ArrowLeft, Users
} from 'lucide-react';
import io from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function WhiteboardPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [ctx, setCtx] = useRef(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [elements, setElements] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  
  // UI state
  const [activeUsers, setActiveUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState(new Map());
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // History
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);

  useEffect(() => {
    initializeWhiteboard();
    return () => cleanup();
  }, [roomId]);

  const initializeWhiteboard = async () => {
    try {
      // Initialize canvas
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      setCtx(context);

      // Set canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 80; // Minus toolbar height

      // Initialize socket
      socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5001');

      setupSocketListeners();
      joinWhiteboard();
    } catch (error) {
      console.error('Error initializing whiteboard:', error);
      toast.error('Failed to initialize whiteboard');
    }
  };

  const setupSocketListeners = () => {
    const socket = socketRef.current;

    // Initial state
    socket.on('whiteboard-state', ({ elements: initialElements, canvas }) => {
      setElements(initialElements);
      redrawCanvas(initialElements);
    });

    // User events
    socket.on('active-users', (users) => {
      setActiveUsers(users);
    });

    socket.on('user-joined-whiteboard', ({ userName, userColor }) => {
      toast(`${userName} joined`, { icon: '👋' });
    });

    socket.on('user-left-whiteboard', ({ userName }) => {
      toast(`${userName} left`);
    });

    // Drawing events
    socket.on('remote-draw-start', ({ x, y, color, width, socketId }) => {
      // Handle remote user starting to draw
    });

    socket.on('remote-draw-move', ({ x, y, socketId }) => {
      // Update remote cursor position while drawing
    });

    socket.on('remote-draw-end', ({ element }) => {
      setElements(prev => [...prev, element]);
      drawElement(element);
    });

    socket.on('remote-add-shape', ({ shape }) => {
      setElements(prev => [...prev, shape]);
      drawElement(shape);
    });

    socket.on('remote-delete-element', ({ elementId }) => {
      setElements(prev => prev.filter(el => el.id !== elementId));
      redrawCanvas(elements.filter(el => el.id !== elementId));
    });

    socket.on('board-cleared', () => {
      setElements([]);
      clearCanvas();
      toast('Board cleared');
    });

    // Cursor tracking
    socket.on('remote-cursor-move', ({ x, y, userName, userColor, socketId }) => {
      setRemoteCursors(prev => {
        const updated = new Map(prev);
        updated.set(socketId, { x, y, userName, userColor });
        return updated;
      });
    });
  };

  const joinWhiteboard = () => {
    const userColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    
    socketRef.current.emit('join-whiteboard', {
      roomId,
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userColor
    });
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    
    if (tool === 'pen' || tool === 'eraser') {
      setCurrentPath([{ x: offsetX, y: offsetY }]);
      
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      socketRef.current.emit('draw-start', {
        x: offsetX,
        y: offsetY,
        color: tool === 'eraser' ? '#ffffff' : color,
        width: tool === 'eraser' ? strokeWidth * 3 : strokeWidth,
        tool
      });
    }
  };

  const draw = (e) => {
    if (!isDrawing) {
      // Just move cursor
      const { offsetX, offsetY } = e.nativeEvent;
      socketRef.current.emit('cursor-move', { x: offsetX, y: offsetY });
      return;
    }

    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
      
      setCurrentPath(prev => [...prev, { x: offsetX, y: offsetY }]);
      
      socketRef.current.emit('draw-move', { x: offsetX, y: offsetY });
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (tool === 'pen' || tool === 'eraser') {
      const element = {
        id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'path',
        points: currentPath,
        strokeColor: tool === 'eraser' ? '#ffffff' : color,
        strokeWidth: tool === 'eraser' ? strokeWidth * 3 : strokeWidth,
        createdAt: new Date()
      };
      
      setElements(prev => [...prev, element]);
      setCurrentPath([]);
      
      socketRef.current.emit('draw-end', { element });
      
      // Add to history
      addToHistory();
    }
  };

  const drawElement = (element) => {
    if (!ctx) return;

    switch (element.type) {
      case 'path':
        if (element.points && element.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          
          ctx.strokeStyle = element.strokeColor;
          ctx.lineWidth = element.strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
        break;
        
      case 'rectangle':
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth;
        if (element.fillColor) {
          ctx.fillStyle = element.fillColor;
          ctx.fillRect(element.x, element.y, element.width, element.height);
        }
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        break;
        
      case 'circle':
        ctx.beginPath();
        ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth;
        if (element.fillColor) {
          ctx.fillStyle = element.fillColor;
          ctx.fill();
        }
        ctx.stroke();
        break;
        
      case 'text':
        ctx.font = `${element.fontSize}px ${element.fontFamily || 'Arial'}`;
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, element.x, element.y);
        break;
    }
  };

  const redrawCanvas = (elementsToDrawList) => {
    if (!ctx) return;
    
    clearCanvas();
    elementsToDrawList.forEach(element => drawElement(element));
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleClearBoard = () => {
    if (window.confirm('Are you sure you want to clear the board?')) {
      socketRef.current.emit('clear-board');
    }
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(prev => prev - 1);
      const previousState = history[historyStep - 1];
      setElements(previousState);
      redrawCanvas(previousState);
      socketRef.current.emit('undo');
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(prev => prev + 1);
      const nextState = history[historyStep + 1];
      setElements(nextState);
      redrawCanvas(nextState);
      socketRef.current.emit('redo');
    }
  };

  const addToHistory = () => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([...elements]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleExport = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    
    toast.success('Whiteboard exported!');
  };

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'move', icon: Move, label: 'Move' }
  ];

  const colors = [
    '#000000', '#ffffff', '#ef4444', '#f59e0b', 
    '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {/* Tools */}
          <div className="flex gap-2">
            {tools.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTool(id)}
                className={`p-2 rounded-lg transition-colors ${
                  tool === id 
                    ? 'bg-rose-600 text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={label}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: color }}
            />
            {showColorPicker && (
              <div className="absolute top-12 left-0 bg-white rounded-lg shadow-lg p-3 flex gap-2 z-10">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      setShowColorPicker(false);
                    }}
                    className="w-8 h-8 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stroke Width */}
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600">{strokeWidth}px</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Actions */}
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>

          <button
            onClick={handleClearBoard}
            className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
            title="Clear Board"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* Active Users */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{activeUsers.length}</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="cursor-crosshair"
        />

        {/* Remote Cursors */}
        {Array.from(remoteCursors.entries()).map(([socketId, cursor]) => (
          <div
            key={socketId}
            className="absolute pointer-events-none"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: cursor.userColor }}
            />
            <div
              className="text-xs px-2 py-1 rounded mt-1 whitespace-nowrap"
              style={{ backgroundColor: cursor.userColor, color: '#fff' }}
            >
              {cursor.userName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}